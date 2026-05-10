"""
Train regressors and log MAE / MAPE / R2 / RMSE to MLflow.

**Data source (default: auto)** — prefers real rows from `recommendation_results`:
features = dish `feature_snapshot` + parent run goals/health; label = persisted hybrid `score`.
If there are not enough rows (`BITESENSE_ML_MIN_DB_ROWS`, default 15), falls back to sklearn
`make_regression` and logs `data_source=synthetic`.

Metrics are always computed on the **held-out test set** from predictions of each fitted model
(`predict` vs `y_test`), not hardcoded.

Run inside Compose (tracking server service `mlflow`):

  docker compose run --rm -e MLFLOW_TRACKING_URI=http://mlflow:5000 api python -m app.ml.train_recommender_mlflow

From the host (default UI http://localhost:5050 — see MLFLOW_HOST_PORT in docker-compose):

  cd backend && MLFLOW_TRACKING_URI=http://127.0.0.1:5050 PYTHONPATH=. python -m app.ml.train_recommender_mlflow
"""

from __future__ import annotations

import os
import random
from typing import Any

import mlflow
import numpy as np
from lightgbm import LGBMRegressor
from sklearn.datasets import make_regression
from sklearn.ensemble import VotingRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from app.database import SessionLocal
from app.ml.dataset_recommendations import FEATURE_COUNT, load_xy_from_db


def _unset_proxy_env() -> None:
    """MLflow uses requests; host/Orb Docker proxies break in-container calls to http://mlflow:5000."""
    for key in (
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "ALL_PROXY",
        "http_proxy",
        "https_proxy",
        "all_proxy",
    ):
        os.environ.pop(key, None)


def _seed_all(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    os.environ.setdefault("PYTHONHASHSEED", str(seed))


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    # sklearn MAPE is a fraction; scale to percent to match common MLflow dashboards
    mape = float(mean_absolute_percentage_error(y_true, y_pred)) * 100.0
    return {"mae": mae, "mape": mape, "r2": r2, "rmse": rmse}


def _log_model_metrics(prefix: str, m: dict[str, float]) -> None:
    for key in ("mae", "mape", "r2", "rmse"):
        mlflow.log_metric(f"{prefix}_{key}", m[key])


def _load_xy_auto(
    *,
    random_state: int,
    synthetic_n_samples: int,
    synthetic_n_features: int,
    min_db_rows: int,
) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
    """Return X, y, metadata. y is either hybrid scores from DB or synthetic regression target."""
    meta: dict[str, Any] = {
        "data_source": "synthetic",
        "min_db_rows_required": min_db_rows,
        "n_samples": 0,
        "n_features": synthetic_n_features,
        "fallback_reason": "",
    }
    db = SessionLocal()
    try:
        X, y, n = load_xy_from_db(db, min_rows=min_db_rows)
        meta["data_source"] = "postgres"
        meta["n_samples"] = n
        meta["n_features"] = int(X.shape[1])
        meta["target"] = "hybrid_score"
        return X, y, meta
    except Exception as exc:  # noqa: BLE001 — surface any DB/parsing issue as fallback
        meta["fallback_reason"] = str(exc)[:800]
        meta["target"] = "sklearn_make_regression"
        X, y = make_regression(
            n_samples=synthetic_n_samples,
            n_features=synthetic_n_features,
            noise=25.0,
            random_state=random_state,
        )
        meta["n_samples"] = int(X.shape[0])
        meta["n_features"] = int(X.shape[1])
        return X, y, meta
    finally:
        db.close()


def run_training(
    *,
    random_state: int = 42,
    synthetic_n_samples: int = 5_000,
    synthetic_n_features: int = 12,
    experiment_name: str = "bitesense-recommender",
    run_name: str | None = None,
) -> dict[str, Any]:
    _seed_all(random_state)

    min_db = int(os.environ.get("BITESENSE_ML_MIN_DB_ROWS", "15"))
    X, y, data_meta = _load_xy_auto(
        random_state=random_state,
        synthetic_n_samples=synthetic_n_samples,
        synthetic_n_features=synthetic_n_features,
        min_db_rows=min_db,
    )
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state
    )

    xgb_params = dict(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=random_state,
        n_jobs=-1,
    )
    lgb_params = {
        **xgb_params,
        "verbose": -1,
    }
    xgb = XGBRegressor(**xgb_params)
    lgb = LGBMRegressor(**lgb_params)
    ensemble = VotingRegressor(
        [
            ("xgboost", XGBRegressor(**xgb_params)),
            ("lightgbm", LGBMRegressor(**lgb_params)),
        ]
    )

    _unset_proxy_env()
    # Default host URI matches compose MLFLOW_HOST_PORT (5050); inside Docker use http://mlflow:5000.
    tracking_uri = (os.environ.get("MLFLOW_TRACKING_URI") or "http://127.0.0.1:5050").strip()
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(experiment_name)

    with mlflow.start_run(run_name=run_name or "baseline-xgb-lgb-ensemble"):
        mlflow.log_param("data_source", data_meta["data_source"])
        mlflow.log_param("n_training_rows", data_meta["n_samples"])
        mlflow.log_param("n_features", data_meta["n_features"])
        mlflow.log_param("random_state", random_state)
        mlflow.log_param("min_db_rows", min_db)
        mlflow.log_param("label", data_meta.get("target", ""))
        if data_meta.get("fallback_reason"):
            mlflow.log_param("dataset_fallback_reason", data_meta["fallback_reason"])
        if data_meta["data_source"] == "postgres":
            mlflow.log_param("feature_schema", f"bitesense_v1_{FEATURE_COUNT}")

        xgb.fit(X_train, y_train)
        pred_x = xgb.predict(X_test)
        mx = _metrics(y_test, pred_x)
        _log_model_metrics("xgboost", mx)
        mlflow.sklearn.log_model(xgb, artifact_path="xgboost_model")

        lgb.fit(X_train, y_train)
        pred_l = lgb.predict(X_test)
        ml_ = _metrics(y_test, pred_l)
        _log_model_metrics("lightgbm", ml_)
        mlflow.sklearn.log_model(lgb, artifact_path="lightgbm_model")

        ensemble.fit(X_train, y_train)
        pred_e = ensemble.predict(X_test)
        me = _metrics(y_test, pred_e)
        _log_model_metrics("ensemble", me)
        mlflow.sklearn.log_model(ensemble, artifact_path="ensemble_model")

        return {
            "tracking_uri": tracking_uri,
            "experiment": experiment_name,
            "data_meta": data_meta,
            "xgboost": mx,
            "lightgbm": ml_,
            "ensemble": me,
        }


def main() -> None:
    out = run_training()
    dm = out.get("data_meta") or {}
    print(
        "Logged metrics to MLflow:",
        out["tracking_uri"],
        f"experiment={out['experiment']}",
        f"data_source={dm.get('data_source')}",
        f"n_samples={dm.get('n_samples')}",
        sep="\n",
    )


if __name__ == "__main__":
    main()
