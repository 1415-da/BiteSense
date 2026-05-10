"""Build training tensors from persisted recommendation rows (hybrid scorer as label)."""

from __future__ import annotations

import os
import zlib

import numpy as np
from sqlalchemy.orm import Session

from app.ml.feature_engineering import DishFeatures
from app.ml.scoring import GoalInputs, HealthInputs


def _goal_feat(primary_goal: str) -> float:
    s = (primary_goal or "").strip()
    if not s:
        return 0.0
    return (zlib.crc32(s.encode("utf-8")) % 10001) / 10000.0


def row_to_features(
    *,
    feature_snapshot: dict,
    request_snapshot: dict,
) -> list[float]:
    """Fixed-order feature vector aligned with hybrid rank inputs (dish + user goals/health)."""
    fs = feature_snapshot or {}
    req = request_snapshot or {}
    g = req.get("goals") or {}
    h = req.get("health") or {}
    allergens = h.get("allergens") or []
    diets = h.get("diets") or []
    return [
        float(fs.get("calories", 0)),
        float(fs.get("protein_g", 0)),
        float(fs.get("carbs_g", 0)),
        float(fs.get("fat_g", 0)),
        float(fs.get("sodium_mg", 0)),
        float(fs.get("sugar_g", 0)),
        float(fs.get("fiber_g", 0)),
        float(fs.get("cooking_score", 0.0)),
        float(g.get("protein_target_g", 120)),
        float(g.get("carbs_target_g", 180)),
        float(g.get("fat_target_g", 55)),
        _goal_feat(str(g.get("primary_goal", ""))),
        float(h.get("max_sodium_mg", 2000)),
        float(h.get("max_sugar_g", 40)),
        min(len(allergens), 20) / 20.0,
        min(len(diets), 10) / 10.0,
    ]


FEATURE_COUNT = 16


def vector_from_dish_context(feat: DishFeatures, goals: GoalInputs, health: HealthInputs) -> list[float]:
    """Same 16-D vector as training; use at inference for the surrogate regressor."""
    f, g, h = feat, goals, health
    fs = {
        "calories": f.calories,
        "protein_g": f.protein_g,
        "carbs_g": f.carbs_g,
        "fat_g": f.fat_g,
        "sodium_mg": f.sodium_mg,
        "sugar_g": f.sugar_g,
        "fiber_g": f.fiber_g,
        "cooking_score": f.cooking_score,
    }
    req = {
        "goals": {
            "primary_goal": g.primary_goal,
            "protein_target_g": g.protein_target_g,
            "carbs_target_g": g.carbs_target_g,
            "fat_target_g": g.fat_target_g,
        },
        "health": {
            "allergens": h.allergens,
            "diets": h.diets,
            "max_sodium_mg": h.max_sodium_mg,
            "max_sugar_g": h.max_sugar_g,
        },
    }
    return row_to_features(feature_snapshot=fs, request_snapshot=req)


def load_xy_from_db(
    session: Session,
    *,
    min_rows: int | None = None,
) -> tuple[np.ndarray, np.ndarray, int]:
    """
    Returns (X, y, n_rows).

    y is the persisted hybrid ranker score for each row (what the API produced).
    X encodes dish feature_snapshot plus goals/health from the parent run.
    """
    from sqlalchemy import select

    from app.models import RecommendationResult, RecommendationRun

    if min_rows is None:
        min_rows = int(os.environ.get("BITESENSE_ML_MIN_DB_ROWS", "15"))

    stmt = (
        select(RecommendationResult, RecommendationRun)
        .join(RecommendationRun, RecommendationResult.run_id == RecommendationRun.id)
    )
    pairs = session.execute(stmt).all()
    if len(pairs) < min_rows:
        raise ValueError(
            f"need at least {min_rows} recommendation_result rows; got {len(pairs)}"
        )

    xs: list[list[float]] = []
    ys: list[float] = []
    for res, run in pairs:
        xs.append(
            row_to_features(
                feature_snapshot=res.feature_snapshot,
                request_snapshot=run.request_snapshot,
            )
        )
        ys.append(float(res.score))

    x_arr = np.asarray(xs, dtype=np.float64)
    y_arr = np.asarray(ys, dtype=np.float64)
    n = x_arr.shape[0]
    if x_arr.shape[1] != FEATURE_COUNT:
        raise RuntimeError(f"expected {FEATURE_COUNT} features, got {x_arr.shape[1]}")
    return x_arr, y_arr, n
