"""Lazy-load surrogate ensemble (sklearn) for blended ranking."""

from __future__ import annotations

import logging
import threading
from typing import Any

import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)
_lock = threading.Lock()
_model: Any | None = None
_load_attempted = False


def get_surrogate_estimator() -> Any | None:
    path = (settings.bitesense_ml_ensemble_path or "").strip()
    if not path:
        return None
    global _model, _load_attempted
    with _lock:
        if _load_attempted:
            return _model
        _load_attempted = True
        try:
            import joblib

            _model = joblib.load(path)
            logger.info("Loaded surrogate ensemble from %s", path)
        except Exception as exc:
            logger.warning("Could not load surrogate model from %s: %s", path, exc)
            _model = None
        return _model


def reset_surrogate_cache_for_tests() -> None:
    global _model, _load_attempted
    with _lock:
        _model = None
        _load_attempted = False


def predict_scores_clipped(X: np.ndarray) -> np.ndarray | None:
    """Return surrogate predictions in [0, 100], or None if no model."""
    est = get_surrogate_estimator()
    if est is None:
        return None
    raw = np.asarray(est.predict(X), dtype=np.float64).ravel()
    out = np.clip(raw, 0.0, 100.0)
    if np.any(np.isnan(out)):
        out = np.nan_to_num(out, nan=0.0, posinf=100.0, neginf=0.0)
    return out
