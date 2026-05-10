from __future__ import annotations

import logging
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser, MlMetricsAccess
from app.ml import metrics as rec_metrics
from app.ml.metrics import MODEL_VERSION
from app.menu_extraction.dishes import rows_to_rank_entries
from app.ml.ranker import GoalInputs, HealthInputs, rank_dishes
from app.models import MenuScan, RecommendationResult, RecommendationRun, UserGoals, UserHealth
from app.schemas_recommendations import (
    RecommendRankIn,
    RecommendRankOut,
    RecommendationHistoryItemOut,
    RecommendationHistoryOut,
    RecommendationRowOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

_MEAL_TYPES = ("Lunch", "Dinner", "Brunch", "All day")

_DEFAULT_GOALS = {
    "primary_goal": "Weight loss",
    "target_weight_kg": "72",
    "workouts_per_week": 4,
    "protein_g": 120,
    "carbs_g": 180,
    "fat_g": 55,
}
_DEFAULT_HEALTH = {
    "allergens": ["Shellfish"],
    "diets": ["Pescatarian"],
    "max_sodium_mg": 2000,
    "max_sugar_g": 40,
}


def _meal_type_for(dish: str, rank_idx: int) -> str:
    h = hash(dish + str(rank_idx))
    return _MEAL_TYPES[h % len(_MEAL_TYPES)]


def _load_goals_health(db: Session, user_id: int) -> tuple[GoalInputs, HealthInputs]:
    g_row = db.query(UserGoals).filter(UserGoals.user_id == user_id).first()
    h_row = db.query(UserHealth).filter(UserHealth.user_id == user_id).first()

    if g_row is None:
        gd = _DEFAULT_GOALS
    else:
        gd = {
            "primary_goal": g_row.primary_goal,
            "target_weight_kg": g_row.target_weight_kg,
            "workouts_per_week": g_row.workouts_per_week,
            "protein_g": g_row.protein_g,
            "carbs_g": g_row.carbs_g,
            "fat_g": g_row.fat_g,
        }
    if h_row is None:
        hd = _DEFAULT_HEALTH
    else:
        hd = {
            "allergens": list(h_row.allergens or []),
            "diets": list(h_row.diets or []),
            "max_sodium_mg": h_row.max_sodium_mg,
            "max_sugar_g": h_row.max_sugar_g,
        }

    goals = GoalInputs(
        primary_goal=str(gd["primary_goal"]),
        protein_target_g=int(gd["protein_g"]),
        carbs_target_g=int(gd["carbs_g"]),
        fat_target_g=int(gd["fat_g"]),
    )
    health = HealthInputs(
        allergens=[str(x) for x in hd["allergens"]],
        diets=[str(x) for x in hd["diets"]],
        max_sodium_mg=int(hd["max_sodium_mg"]),
        max_sugar_g=int(hd["max_sugar_g"]),
    )
    return goals, health


@router.post("/rank", response_model=RecommendRankOut)
def rank_menu(
    body: RecommendRankIn,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> RecommendRankOut:
    t0 = rec_metrics.record_request_start()

    if body.scan_id is not None:
        scan = (
            db.query(MenuScan)
            .filter(MenuScan.id == body.scan_id, MenuScan.user_id == user.id)
            .first()
        )
        if scan is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    else:
        scan = (
            db.query(MenuScan)
            .filter(MenuScan.user_id == user.id)
            .order_by(MenuScan.created_at.desc())
            .first()
        )
        if scan is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No menu scan available")

    dishes_raw = list(scan.dishes or [])
    dish_entries = rows_to_rank_entries(dishes_raw)
    if not dish_entries:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Scan has no dishes")

    goals, health = _load_goals_health(db, user.id)
    ranked, n_filtered = rank_dishes(dish_entries, goals, health, top_n=body.top_n)

    latency_s = time.perf_counter() - t0
    latency_ms = round(latency_s * 1000.0, 2)

    restaurant_label = (scan.restaurant_name or "").strip() or "Menu scan"
    location_parts = [p for p in [(scan.cuisine_type or "").strip(), (scan.location or "").strip()] if p]
    location_label = " · ".join(location_parts) if location_parts else "Any location"

    request_snapshot = {
        "goals": {
            "primary_goal": goals.primary_goal,
            "protein_target_g": goals.protein_target_g,
            "carbs_target_g": goals.carbs_target_g,
            "fat_target_g": goals.fat_target_g,
        },
        "health": {
            "allergens": health.allergens,
            "diets": health.diets,
            "max_sodium_mg": health.max_sodium_mg,
            "max_sugar_g": health.max_sugar_g,
        },
        "dish_count": len(dish_entries),
        "scan_id": scan.id,
    }
    metrics_payload: dict[str, object] = {
        "model_version": MODEL_VERSION,
        "latency_ms": latency_ms,
        "input_dishes": len(dish_entries),
        "filtered_out": n_filtered,
        "output_dishes": len(ranked),
    }

    run_row = RecommendationRun(
        user_id=user.id,
        menu_scan_id=scan.id,
        model_version=MODEL_VERSION,
        request_snapshot=request_snapshot,
        metrics=metrics_payload,
    )
    db.add(run_row)
    db.flush()

    rows_out: list[RecommendationRowOut] = []
    for i, rd in enumerate(ranked, start=1):
        feat = rd.features
        fsnap = {
            "calories": feat.calories,
            "protein_g": feat.protein_g,
            "carbs_g": feat.carbs_g,
            "fat_g": feat.fat_g,
            "sodium_mg": feat.sodium_mg,
            "sugar_g": feat.sugar_g,
            "fiber_g": feat.fiber_g,
            "cooking_score": feat.cooking_score,
        }
        res = RecommendationResult(
            run_id=run_row.id,
            rank_position=i,
            dish_name=rd.dish_name,
            score=rd.score,
            calories=rd.calories,
            protein_g=rd.protein_g,
            carbs_g=rd.carbs_g,
            fat_g=rd.fat_g,
            protein_fill=rd.protein_fill,
            carbs_fill=rd.carbs_fill,
            fat_fill=rd.fat_fill,
            why_match=rd.why_match,
            smart_mods=rd.smart_mods,
            feature_snapshot=fsnap,
        )
        db.add(res)

        row_id = f"run-{run_row.id}-{i}-{hash(rd.dish_name) & 0xFFFFFFFF}"
        rows_out.append(
            RecommendationRowOut(
                id=row_id,
                dish_name=rd.dish_name,
                restaurant_label=restaurant_label,
                meal_type=_meal_type_for(rd.dish_name, i),
                score=rd.score,
                rank=i,
                calories=rd.calories,
                protein_g=rd.protein_g,
                carbs_g=rd.carbs_g,
                fat_g=rd.fat_g,
                protein_fill=rd.protein_fill,
                carbs_fill=rd.carbs_fill,
                fat_fill=rd.fat_fill,
                why_match=rd.why_match,
                smart_mods=rd.smart_mods,
            )
        )

    db.commit()
    db.refresh(run_row)

    rec_metrics.record_rank_success(
        latency_s=latency_s,
        run_id=run_row.id,
        input_dishes=len(dish_entries),
        output_dishes=len(ranked),
        filtered_out=n_filtered,
        persisted=True,
    )

    logger.info(
        "METRICS rank user_id=%s run_id=%s latency_ms=%s input=%d output=%d filtered=%d model=%s",
        user.id,
        run_row.id,
        latency_ms,
        len(dish_entries),
        len(ranked),
        n_filtered,
        MODEL_VERSION,
    )

    return RecommendRankOut(
        run_id=run_row.id,
        model_version=MODEL_VERSION,
        restaurant_label=restaurant_label,
        location=location_label,
        last_scan_at=scan.created_at,
        confidence=scan.confidence,
        metrics=metrics_payload | {"run_id": run_row.id},
        rows=rows_out,
    )


@router.get("/metrics")
def recommendation_metrics(_: MlMetricsAccess) -> dict[str, object]:
    """Aggregated hybrid scorer stats (JWT, or X-ML-Internal-Secret when API ML_METRICS_INTERNAL_SECRET is set)."""
    snap = rec_metrics.snapshot_dict()
    logger.debug("metrics_snapshot %s", snap)
    return snap


@router.get("/metrics/prometheus", response_class=PlainTextResponse)
def recommendation_metrics_prometheus(_: MlMetricsAccess) -> str:
    """Prometheus text format for scraping (same auth as /metrics)."""
    return rec_metrics.prometheus_export()


@router.get("/history", response_model=RecommendationHistoryOut)
def recommendation_history(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(default=20, ge=1, le=100),
) -> RecommendationHistoryOut:
    runs = (
        db.query(RecommendationRun)
        .filter(RecommendationRun.user_id == user.id)
        .order_by(RecommendationRun.created_at.desc())
        .limit(limit)
        .all()
    )
    items: list[RecommendationHistoryItemOut] = []
    for run in runs:
        top = (
            db.query(RecommendationResult)
            .filter(RecommendationResult.run_id == run.id)
            .order_by(RecommendationResult.rank_position.asc())
            .first()
        )
        items.append(
            RecommendationHistoryItemOut(
                run_id=run.id,
                menu_scan_id=run.menu_scan_id,
                created_at=run.created_at,
                model_version=run.model_version,
                metrics=dict(run.metrics or {}),
                top_dish=top.dish_name if top else None,
                top_score=float(top.score) if top else None,
            )
        )
    return RecommendationHistoryOut(items=items)
