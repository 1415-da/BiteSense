"""Hard filters + ranking orchestration."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any

import numpy as np

from app.config import settings
from app.ml.dataset_recommendations import FEATURE_COUNT, vector_from_dish_context
from app.ml.dish_row import DishRow
from app.ml.explanations import ExplanationContext
from app.ml.feature_engineering import DishFeatures, dish_tokens_lower, extract_features_from_row
from app.ml.llm_explanations import enhance_explanations_batch
from app.ml.scoring import GoalInputs, HealthInputs, macro_fills, score_dish
from app.ml.surrogate_model import predict_scores_clipped

logger = logging.getLogger(__name__)

_MEAT = {
    "chicken",
    "beef",
    "pork",
    "lamb",
    "steak",
    "ribs",
    "bacon",
    "sausage",
    "turkey",
    "duck",
    "salmon",
    "tuna",
    "shrimp",
    "crab",
    "lobster",
    "fish",
    "seafood",
}
_DAIRY = {"milk", "cream", "cheese", "butter", "yogurt", "paneer"}
_EGGS = {"egg", "eggs", "mayo"}


@dataclass(slots=True)
class RankedDish:
    dish_name: str
    score: float
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    protein_fill: float
    carbs_fill: float
    fat_fill: float
    why_match: list[str]
    smart_mods: list[str]
    features: DishFeatures
    filtered_reason: str | None = None
    #: Set after surrogate step: pure hybrid vs ML (when blend active)
    score_heuristic: float | None = None
    score_ml: float | None = None


def _violates_diet(name_lower: str, diets: list[str]) -> str | None:
    djoin = " ".join(d.lower() for d in diets)
    if "vegan" in djoin:
        if any(m in name_lower for m in _MEAT) or any(d in name_lower for d in _DAIRY) or any(e in name_lower for e in _EGGS):
            return "Excluded by vegan diet selection."
    if "vegetarian" in djoin and "vegan" not in djoin:
        if any(m in name_lower for m in _MEAT):
            return "Excluded by vegetarian diet selection."
    return None


def _violates_allergen(name: str, allergens: list[str]) -> str | None:
    if not allergens:
        return None
    lower = name.lower()
    toks = dish_tokens_lower(name)
    seafood_tokens = ("shrimp", "crab", "lobster", "clam", "mussel", "oyster", "scallop", "squid", "octopus")
    for a in allergens:
        al = a.strip().lower()
        if len(al) < 2:
            continue
        if "shellfish" in al or al == "shellfish":
            if any(t in lower for t in seafood_tokens):
                return "Possible shellfish allergen match."
        if al in lower:
            return f"Possible allergen match: {a}."
        parts = re.split(r"[\s,]+", al)
        for p in parts:
            if len(p) >= 3 and p in toks:
                return f"Possible allergen match: {a}."
    return None


def _normalize_dish_rows(
    dish_rows: list[DishRow] | list[tuple[str, str]],
) -> list[DishRow]:
    out: list[DishRow] = []
    for item in dish_rows:
        if isinstance(item, DishRow):
            out.append(item)
        elif isinstance(item, tuple) and len(item) >= 2:
            d, s = item[0].strip(), item[1].strip()
            if d and s:
                out.append(DishRow(display_name=d, scoring_text=s, ingredients=[]))
    return out


def rank_dishes(
    dish_rows: list[DishRow] | list[tuple[str, str]],
    goals: GoalInputs,
    health: HealthInputs,
    *,
    top_n: int = 6,
) -> tuple[list[RankedDish], int, dict[str, Any]]:
    """
    Rank dishes from structured scan rows (name + ingredients).

    When ``BITESENSE_ML_ENSEMBLE_PATH`` loads, ``score`` blends heuristic + surrogate.
    Explanations use ingredient-based estimates + rules; optional LLM polish when configured.
    """
    blend_info: dict[str, Any] = {
        "surrogate_used": False,
        "blend_heuristic_weight": float(settings.bitesense_ml_blend_heuristic),
        "mean_heuristic": None,
        "mean_ml": None,
        "mean_final": None,
        "llm_explanations": bool(settings.openai_api_key.strip() and settings.bitesense_llm_explanations),
    }
    rows = _normalize_dish_rows(dish_rows)
    filtered = 0
    candidates: list[RankedDish] = []

    for idx, row in enumerate(rows):
        display_name = row.display_name.strip()
        scoring_text = row.scoring_text.strip()
        if not display_name or not scoring_text:
            continue

        fr = _violates_allergen(scoring_text, health.allergens)
        if fr:
            logger.debug("filter allergen: %s (%s)", display_name, fr)
            filtered += 1
            continue

        dl = scoring_text.lower()
        dr = _violates_diet(dl, health.diets)
        if dr:
            logger.debug("filter diet: %s (%s)", display_name, dr)
            filtered += 1
            continue

        feat = extract_features_from_row(row, idx)
        sc = score_dish(feat, goals, health)
        pf, cf, ff = macro_fills(feat, goals)

        candidates.append(
            RankedDish(
                dish_name=display_name,
                score=sc,
                calories=feat.calories,
                protein_g=feat.protein_g,
                carbs_g=feat.carbs_g,
                fat_g=feat.fat_g,
                protein_fill=round(pf, 1),
                carbs_fill=round(cf, 1),
                fat_fill=round(ff, 1),
                why_match=[],
                smart_mods=[],
                features=feat,
            )
        )

    if candidates:
        X = np.asarray(
            [vector_from_dish_context(c.features, goals, health) for c in candidates],
            dtype=np.float64,
        )
        if X.shape[1] != FEATURE_COUNT:
            raise RuntimeError(f"feature dim {X.shape[1]} != {FEATURE_COUNT}")
        ml_scores = predict_scores_clipped(X)
        w = float(settings.bitesense_ml_blend_heuristic)
        if ml_scores is not None:
            blend_info["surrogate_used"] = True
            for i, c in enumerate(candidates):
                h = float(c.score)
                m = float(ml_scores[i])
                c.score_heuristic = h
                c.score_ml = m
                c.score = w * h + (1.0 - w) * m
        else:
            for c in candidates:
                c.score_heuristic = float(c.score)
                c.score_ml = None

        hs = [float(c.score_heuristic or c.score) for c in candidates]
        blend_info["mean_heuristic"] = round(sum(hs) / len(hs), 4)
        if blend_info["surrogate_used"]:
            mlv = [float(c.score_ml) for c in candidates if c.score_ml is not None]
            blend_info["mean_ml"] = round(sum(mlv) / len(mlv), 4) if mlv else None
        finals = [float(c.score) for c in candidates]
        blend_info["mean_final"] = round(sum(finals) / len(finals), 4)

    candidates.sort(key=lambda r: r.score, reverse=True)
    protein_order = sorted(range(len(candidates)), key=lambda i: candidates[i].protein_g, reverse=True)
    protein_rank = {protein_order[i]: i + 1 for i in range(len(protein_order))}

    top = candidates[: max(1, top_n)]
    exp_payload: list[dict[str, Any]] = []
    for rank_i, c in enumerate(top):
        idx_in_all = candidates.index(c)
        ctx = ExplanationContext(
            rank_among_scan=rank_i + 1,
            total_ranked=len(candidates),
            protein_rank=protein_rank.get(idx_in_all, rank_i + 1),
        )
        exp_payload.append({"features": c.features, "score": c.score, "ctx": ctx})

    enhanced = enhance_explanations_batch(exp_payload, goals, health)
    for c, (why, mods) in zip(top, enhanced):
        c.why_match = why
        c.smart_mods = mods

    return top, filtered, blend_info
