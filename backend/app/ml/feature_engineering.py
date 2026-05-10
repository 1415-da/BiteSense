"""Deterministic feature extraction from dish names (v1 — no external nutrition API)."""

from __future__ import annotations

import re
from dataclasses import dataclass


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


def _hash_mix(seed: int, s: str) -> int:
    h = seed
    for ch in s.lower():
        h = (h * 31 + ord(ch)) & 0x7FFFFFFF
    return h


def extract_features(dish_name: str, idx: int = 0) -> DishFeatures:
    name = dish_name.strip() or "Unknown dish"
    h = _hash_mix(2166136261 + idx * 997, name)

    # Plausible macro ranges for restaurant meals
    protein_g = 12 + (h % 48)
    carbs_g = 20 + ((h >> 3) % 70)
    fat_g = 5 + ((h >> 6) % 35)
    calories = int(protein_g * 4 + carbs_g * 4 + fat_g * 9 + (h % 120))
    sodium_mg = 400 + (h % 1800)
    sugar_g = 5 + ((h >> 9) % 35)
    fiber_g = 2 + ((h >> 12) % 14)

    lower = name.lower()
    cooking = 0.0
    if any(k in lower for k in ("fried", "deep-fried", "crispy", "tempura", "fritter")):
        cooking -= 0.9
    if any(k in lower for k in ("cream", "alfredo", "butter", "cheese sauce", "gravy")):
        cooking -= 0.35
    if any(k in lower for k in ("grilled", "steamed", "baked", "poached", "broiled")):
        cooking += 0.55
    if "salad" in lower or "bowl" in lower:
        cooking += 0.25

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
        cooking_score=max(-1.0, min(1.0, cooking)),
        is_likely_vegetarian=is_veg,
    )


_ALLERGEN_PAT = re.compile(r"[,\s]+")


def dish_tokens_lower(name: str) -> set[str]:
    parts = re.split(r"[^\w]+", name.lower())
    return {p for p in parts if len(p) >= 3}
