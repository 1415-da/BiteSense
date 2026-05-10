"""In-process recommendation metrics for observability (Docker logs + /metrics API)."""

from __future__ import annotations

import threading
import time
from dataclasses import asdict, dataclass, field


@dataclass
class RecommendationMetricsSnapshot:
    model_version: str
    total_rank_calls: int
    total_runs_persisted: int
    total_items_scored: int
    total_filtered_out: int
    last_run_ms: float | None
    last_run_id: int | None
    last_input_dishes: int | None
    last_output_dishes: int | None
    avg_run_ms: float
    errors: int
    last_surrogate_used: bool
    last_blend_heuristic_weight: float
    last_mean_heuristic: float | None
    last_mean_ml: float | None
    last_mean_final: float | None


_lock = threading.Lock()
_state: dict[str, float | int | bool | None] = {
    "total_rank_calls": 0,
    "total_runs_persisted": 0,
    "total_items_scored": 0,
    "total_filtered_out": 0,
    "sum_run_ms": 0.0,
    "errors": 0,
    "last_run_ms": None,
    "last_run_id": None,
    "last_input_dishes": None,
    "last_output_dishes": None,
    "last_surrogate_used": False,
    "last_blend_w": 0.55,
    "last_mean_h": None,
    "last_mean_ml": None,
    "last_mean_final": None,
}

MODEL_VERSION = "hybrid-v1"


def resolve_model_version(*, surrogate_used: bool) -> str:
    return f"{MODEL_VERSION}+surrogate" if surrogate_used else MODEL_VERSION


def record_request_start() -> float:
    return time.perf_counter()


def record_rank_success(
    *,
    latency_s: float,
    run_id: int | None,
    input_dishes: int,
    output_dishes: int,
    filtered_out: int,
    persisted: bool,
    blend: dict[str, object] | None = None,
) -> None:
    with _lock:
        _state["total_rank_calls"] = int(_state["total_rank_calls"]) + 1
        _state["sum_run_ms"] = float(_state["sum_run_ms"]) + latency_s * 1000.0
        _state["last_run_ms"] = latency_s * 1000.0
        _state["last_run_id"] = run_id
        _state["last_input_dishes"] = input_dishes
        _state["last_output_dishes"] = output_dishes
        _state["total_items_scored"] = int(_state["total_items_scored"]) + output_dishes
        _state["total_filtered_out"] = int(_state["total_filtered_out"]) + filtered_out
        if persisted and run_id is not None:
            _state["total_runs_persisted"] = int(_state["total_runs_persisted"]) + 1
        if blend is not None:
            _state["last_surrogate_used"] = bool(blend.get("surrogate_used"))
            _state["last_blend_w"] = float(blend.get("blend_heuristic_weight", 0.55))
            _state["last_mean_h"] = blend.get("mean_heuristic")
            _state["last_mean_ml"] = blend.get("mean_ml")
            _state["last_mean_final"] = blend.get("mean_final")


def record_error() -> None:
    with _lock:
        _state["errors"] = int(_state["errors"]) + 1


def get_snapshot() -> RecommendationMetricsSnapshot:
    with _lock:
        calls = max(1, int(_state["total_rank_calls"]))
        avg = float(_state["sum_run_ms"]) / calls
        lh = _state["last_mean_h"]
        lm = _state["last_mean_ml"]
        lf = _state["last_mean_final"]
        return RecommendationMetricsSnapshot(
            model_version=MODEL_VERSION,
            total_rank_calls=int(_state["total_rank_calls"]),
            total_runs_persisted=int(_state["total_runs_persisted"]),
            total_items_scored=int(_state["total_items_scored"]),
            total_filtered_out=int(_state["total_filtered_out"]),
            last_run_ms=_state["last_run_ms"] if _state["last_run_ms"] is not None else None,
            last_run_id=int(_state["last_run_id"]) if _state["last_run_id"] is not None else None,
            last_input_dishes=int(_state["last_input_dishes"]) if _state["last_input_dishes"] is not None else None,
            last_output_dishes=int(_state["last_output_dishes"]) if _state["last_output_dishes"] is not None else None,
            avg_run_ms=round(avg, 3),
            errors=int(_state["errors"]),
            last_surrogate_used=bool(_state.get("last_surrogate_used", False)),
            last_blend_heuristic_weight=float(_state.get("last_blend_w", 0.55)),
            last_mean_heuristic=float(lh) if lh is not None else None,
            last_mean_ml=float(lm) if lm is not None else None,
            last_mean_final=float(lf) if lf is not None else None,
        )


def snapshot_dict() -> dict[str, object]:
    return asdict(get_snapshot())


def prometheus_export() -> str:
    """Prometheus text exposition for /metrics scraping (hybrid recommender in-process stats)."""
    s = get_snapshot()
    lines: list[str] = [
        "# HELP bitesense_ml_model_info Hybrid scorer build label.",
        "# TYPE bitesense_ml_model_info gauge",
        f'bitesense_ml_model_info{{version="{s.model_version}"}} 1',
        "",
        "# HELP bitesense_ml_rank_calls_total Total POST /recommendations/rank completions.",
        "# TYPE bitesense_ml_rank_calls_total counter",
        f"bitesense_ml_rank_calls_total {s.total_rank_calls}",
        "",
        "# HELP bitesense_ml_runs_persisted_total Recommendation runs written to DB.",
        "# TYPE bitesense_ml_runs_persisted_total counter",
        f"bitesense_ml_runs_persisted_total {s.total_runs_persisted}",
        "",
        "# HELP bitesense_ml_items_scored_total Dish rows emitted by ranker.",
        "# TYPE bitesense_ml_items_scored_total counter",
        f"bitesense_ml_items_scored_total {s.total_items_scored}",
        "",
        "# HELP bitesense_ml_items_filtered_total Dishes removed by allergen/diet hard filters.",
        "# TYPE bitesense_ml_items_filtered_total counter",
        f"bitesense_ml_items_filtered_total {s.total_filtered_out}",
        "",
        "# HELP bitesense_ml_errors_total Scorer errors (if recorded).",
        "# TYPE bitesense_ml_errors_total counter",
        f"bitesense_ml_errors_total {s.errors}",
        "",
        "# HELP bitesense_ml_last_run_ms Last rank wall-clock milliseconds.",
        "# TYPE bitesense_ml_last_run_ms gauge",
        f"bitesense_ml_last_run_ms {s.last_run_ms if s.last_run_ms is not None else -1}",
        "",
        "# HELP bitesense_ml_last_run_id Last persisted recommendation run id.",
        "# TYPE bitesense_ml_last_run_id gauge",
        f"bitesense_ml_last_run_id {s.last_run_id if s.last_run_id is not None else -1}",
        "",
        "# HELP bitesense_ml_last_input_dishes Dish count for last rank.",
        "# TYPE bitesense_ml_last_input_dishes gauge",
        f"bitesense_ml_last_input_dishes {s.last_input_dishes if s.last_input_dishes is not None else -1}",
        "",
        "# HELP bitesense_ml_last_output_dishes Output rows for last rank.",
        "# TYPE bitesense_ml_last_output_dishes gauge",
        f"bitesense_ml_last_output_dishes {s.last_output_dishes if s.last_output_dishes is not None else -1}",
        "",
        "# HELP bitesense_ml_avg_rank_ms Average rank latency (ms).",
        "# TYPE bitesense_ml_avg_rank_ms gauge",
        f"bitesense_ml_avg_rank_ms {s.avg_run_ms}",
        "",
        "# HELP bitesense_ml_surrogate_active Last rank used surrogate blend (1=yes).",
        "# TYPE bitesense_ml_surrogate_active gauge",
        f"bitesense_ml_surrogate_active {1 if s.last_surrogate_used else 0}",
        "",
        "# HELP bitesense_ml_blend_heuristic_weight Weight on heuristic in last surrogate blend.",
        "# TYPE bitesense_ml_blend_heuristic_weight gauge",
        f"bitesense_ml_blend_heuristic_weight {s.last_blend_heuristic_weight}",
        "",
        "# HELP bitesense_ml_last_mean_heuristic Mean heuristic score last rank (candidates).",
        "# TYPE bitesense_ml_last_mean_heuristic gauge",
        f"bitesense_ml_last_mean_heuristic {s.last_mean_heuristic if s.last_mean_heuristic is not None else -1}",
        "",
        "# HELP bitesense_ml_last_mean_ml Mean surrogate score last rank when active.",
        "# TYPE bitesense_ml_last_mean_ml gauge",
        f"bitesense_ml_last_mean_ml {s.last_mean_ml if s.last_mean_ml is not None else -1}",
        "",
        "# HELP bitesense_ml_last_mean_final Mean blended score last rank.",
        "# TYPE bitesense_ml_last_mean_final gauge",
        f"bitesense_ml_last_mean_final {s.last_mean_final if s.last_mean_final is not None else -1}",
        "",
    ]
    return "\n".join(lines)
