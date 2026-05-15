"""Feature extraction from dish rows (ingredient estimates + hash fallback)."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.ml.dish_row import DishRow
from app.ml.nutrition_estimate import NutritionEstimate, estimate_from_row


@dataclass(slots=True)
class DishFeatures:
    name: str
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    sodium_mg: int
    sugar_g: int
    fiber_g: int
    cooking_score: float  # -1 fried .. +1 clean
    is_likely_vegetarian: bool
    ingredients: list[str] = field(default_factory=list)
    matched_ingredients: list[str] = field(default_factory=list)
    estimate_source: str = "hash"

    def scoring_blob_lower(self) -> str:
        parts = [self.name.lower()]
        parts.extend(i.lower() for i in self.ingredients)
        return " ".join(parts)


def _hash_mix(seed: int, s: str) -> int:
    h = seed
    for ch in s.lower():
        h = (h * 31 + ord(ch)) & 0x7FFFFFFF
    return h


def extract_features(dish_name: str, idx: int = 0) -> DishFeatures:
    """Legacy: hash-based estimate from a single text blob."""
    name = dish_name.strip() or "Unknown dish"
    h = _hash_mix(2166136261 + idx * 997, name)

    protein_g = 12 + (h % 48)
    carbs_g = 20 + ((h >> 3) % 70)
    fat_g = 5 + ((h >> 6) % 35)
    calories = int(protein_g * 4 + carbs_g * 4 + fat_g * 9 + (h % 120))
    sodium_mg = 400 + (h % 1800)
    sugar_g = 5 + ((h >> 9) % 35)
    fiber_g = 2 + ((h >> 12) % 14)

    lower = name.lower()
    cooking = _cooking_score_from_lower(lower)
    meat_words = ("chicken", "beef", "pork", "lamb", "steak", "salmon", "fish", "shrimp", "crab", "turkey")
    is_veg = not any(w in lower for w in meat_words)

    return DishFeatures(
        name=name,
        calories=calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        sodium_mg=sodium_mg,
        sugar_g=sugar_g,
        fiber_g=fiber_g,
        cooking_score=cooking,
        is_likely_vegetarian=is_veg,
        ingredients=[],
        matched_ingredients=[],
        estimate_source="hash",
    )


def features_from_estimate(row: DishRow, est: NutritionEstimate) -> DishFeatures:
    return DishFeatures(
        name=row.display_name,
        calories=est.calories,
        protein_g=est.protein_g,
        carbs_g=est.carbs_g,
        fat_g=est.fat_g,
        sodium_mg=est.sodium_mg,
        sugar_g=est.sugar_g,
        fiber_g=est.fiber_g,
        cooking_score=est.cooking_score,
        is_likely_vegetarian=est.is_likely_vegetarian,
        ingredients=list(row.ingredients),
        matched_ingredients=list(est.matched_ingredients),
        estimate_source=est.source,
    )


def extract_features_from_row(row: DishRow, idx: int = 0) -> DishFeatures:
    est = estimate_from_row(row, idx=idx)
    return features_from_estimate(row, est)


def _cooking_score_from_lower(lower: str) -> float:
    cooking = 0.0
    if any(k in lower for k in ("fried", "deep-fried", "crispy", "tempura", "fritter")):
        cooking -= 0.9
    if any(k in lower for k in ("cream", "alfredo", "butter", "cheese sauce", "gravy")):
        cooking -= 0.35
    if any(k in lower for k in ("grilled", "steamed", "baked", "poached", "broiled")):
        cooking += 0.55
    if "salad" in lower or "bowl" in lower:
        cooking += 0.25
    return max(-1.0, min(1.0, cooking))


_ALLERGEN_PAT = re.compile(r"[,\s]+")


def dish_tokens_lower(name: str) -> set[str]:
    parts = re.split(r"[^\w]+", name.lower())
    return {p for p in parts if len(p) >= 3}
