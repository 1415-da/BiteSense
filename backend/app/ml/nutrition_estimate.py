"""Estimate dish macros from ingredient lists and menu text (no external API)."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.ml.dish_row import DishRow

# Per typical restaurant portion contribution (not per 100g — tuned for menu-scale estimates).
_INGREDIENT_PROFILES: dict[str, dict[str, float | int]] = {
    "chicken": {"calories": 180, "protein_g": 28, "carbs_g": 0, "fat_g": 6, "sodium_mg": 90, "sugar_g": 0, "fiber_g": 0},
    "beef": {"calories": 220, "protein_g": 26, "carbs_g": 0, "fat_g": 12, "sodium_mg": 85, "sugar_g": 0, "fiber_g": 0},
    "pork": {"calories": 200, "protein_g": 24, "carbs_g": 0, "fat_g": 11, "sodium_mg": 80, "sugar_g": 0, "fiber_g": 0},
    "fish": {"calories": 160, "protein_g": 26, "carbs_g": 0, "fat_g": 5, "sodium_mg": 70, "sugar_g": 0, "fiber_g": 0},
    "salmon": {"calories": 190, "protein_g": 25, "carbs_g": 0, "fat_g": 9, "sodium_mg": 75, "sugar_g": 0, "fiber_g": 0},
    "tuna": {"calories": 150, "protein_g": 28, "carbs_g": 0, "fat_g": 3, "sodium_mg": 60, "sugar_g": 0, "fiber_g": 0},
    "shrimp": {"calories": 120, "protein_g": 22, "carbs_g": 1, "fat_g": 2, "sodium_mg": 180, "sugar_g": 0, "fiber_g": 0},
    "egg": {"calories": 70, "protein_g": 6, "carbs_g": 1, "fat_g": 5, "sodium_mg": 70, "sugar_g": 0, "fiber_g": 0},
    "paneer": {"calories": 260, "protein_g": 18, "carbs_g": 8, "fat_g": 18, "sodium_mg": 40, "sugar_g": 2, "fiber_g": 0},
    "tofu": {"calories": 140, "protein_g": 14, "carbs_g": 4, "fat_g": 7, "sodium_mg": 20, "sugar_g": 1, "fiber_g": 2},
    "rice": {"calories": 200, "protein_g": 4, "carbs_g": 44, "fat_g": 1, "sodium_mg": 5, "sugar_g": 0, "fiber_g": 1},
    "pasta": {"calories": 220, "protein_g": 8, "carbs_g": 42, "fat_g": 2, "sodium_mg": 10, "sugar_g": 2, "fiber_g": 2},
    "noodles": {"calories": 210, "protein_g": 7, "carbs_g": 40, "fat_g": 3, "sodium_mg": 320, "sugar_g": 2, "fiber_g": 2},
    "bread": {"calories": 80, "protein_g": 3, "carbs_g": 14, "fat_g": 1, "sodium_mg": 140, "sugar_g": 2, "fiber_g": 1},
    "tortilla": {"calories": 150, "protein_g": 4, "carbs_g": 24, "fat_g": 4, "sodium_mg": 320, "sugar_g": 1, "fiber_g": 2},
    "potato": {"calories": 160, "protein_g": 4, "carbs_g": 36, "fat_g": 0, "sodium_mg": 20, "sugar_g": 2, "fiber_g": 3},
    "cheese": {"calories": 110, "protein_g": 7, "carbs_g": 1, "fat_g": 9, "sodium_mg": 180, "sugar_g": 0, "fiber_g": 0},
    "cream": {"calories": 100, "protein_g": 1, "carbs_g": 1, "fat_g": 10, "sodium_mg": 30, "sugar_g": 1, "fiber_g": 0},
    "butter": {"calories": 100, "protein_g": 0, "carbs_g": 0, "fat_g": 11, "sodium_mg": 90, "sugar_g": 0, "fiber_g": 0},
    "yogurt": {"calories": 80, "protein_g": 6, "carbs_g": 8, "fat_g": 2, "sodium_mg": 55, "sugar_g": 6, "fiber_g": 0},
    "milk": {"calories": 60, "protein_g": 3, "carbs_g": 5, "fat_g": 3, "sodium_mg": 40, "sugar_g": 5, "fiber_g": 0},
    "tomato": {"calories": 25, "protein_g": 1, "carbs_g": 5, "fat_g": 0, "sodium_mg": 10, "sugar_g": 3, "fiber_g": 1},
    "vegetables": {"calories": 40, "protein_g": 2, "carbs_g": 8, "fat_g": 0, "sodium_mg": 25, "sugar_g": 3, "fiber_g": 3},
    "greens": {"calories": 25, "protein_g": 2, "carbs_g": 4, "fat_g": 0, "sodium_mg": 20, "sugar_g": 2, "fiber_g": 2},
    "cabbage": {"calories": 30, "protein_g": 1, "carbs_g": 7, "fat_g": 0, "sodium_mg": 20, "sugar_g": 3, "fiber_g": 2},
    "carrot": {"calories": 35, "protein_g": 1, "carbs_g": 8, "fat_g": 0, "sodium_mg": 30, "sugar_g": 4, "fiber_g": 2},
    "avocado": {"calories": 120, "protein_g": 2, "carbs_g": 6, "fat_g": 11, "sodium_mg": 5, "sugar_g": 1, "fiber_g": 5},
    "beans": {"calories": 120, "protein_g": 8, "carbs_g": 20, "fat_g": 1, "sodium_mg": 200, "sugar_g": 1, "fiber_g": 6},
    "lentils": {"calories": 110, "protein_g": 9, "carbs_g": 18, "fat_g": 1, "sodium_mg": 15, "sugar_g": 2, "fiber_g": 5},
    "chickpea": {"calories": 130, "protein_g": 7, "carbs_g": 22, "fat_g": 2, "sodium_mg": 120, "sugar_g": 3, "fiber_g": 5},
    "soy": {"calories": 60, "protein_g": 6, "carbs_g": 4, "fat_g": 2, "sodium_mg": 400, "sugar_g": 1, "fiber_g": 1},
    "sauce": {"calories": 50, "protein_g": 1, "carbs_g": 6, "fat_g": 2, "sodium_mg": 350, "sugar_g": 4, "fiber_g": 0},
    "gravy": {"calories": 60, "protein_g": 2, "carbs_g": 5, "fat_g": 3, "sodium_mg": 380, "sugar_g": 2, "fiber_g": 0},
    "spices": {"calories": 15, "protein_g": 1, "carbs_g": 2, "fat_g": 1, "sodium_mg": 120, "sugar_g": 0, "fiber_g": 1},
    "chocolate": {"calories": 150, "protein_g": 2, "carbs_g": 18, "fat_g": 8, "sodium_mg": 20, "sugar_g": 14, "fiber_g": 2},
    "sugar": {"calories": 50, "protein_g": 0, "carbs_g": 12, "fat_g": 0, "sodium_mg": 0, "sugar_g": 12, "fiber_g": 0},
    "honey": {"calories": 60, "protein_g": 0, "carbs_g": 17, "fat_g": 0, "sodium_mg": 1, "sugar_g": 16, "fiber_g": 0},
    "coffee": {"calories": 80, "protein_g": 2, "carbs_g": 10, "fat_g": 3, "sodium_mg": 40, "sugar_g": 8, "fiber_g": 0},
    "mango": {"calories": 90, "protein_g": 1, "carbs_g": 22, "fat_g": 0, "sodium_mg": 2, "sugar_g": 20, "fiber_g": 2},
    "flour": {"calories": 120, "protein_g": 3, "carbs_g": 24, "fat_g": 1, "sodium_mg": 2, "sugar_g": 0, "fiber_g": 1},
    "seaweed": {"calories": 30, "protein_g": 2, "carbs_g": 4, "fat_g": 0, "sodium_mg": 200, "sugar_g": 0, "fiber_g": 2},
    "peanut": {"calories": 90, "protein_g": 4, "carbs_g": 3, "fat_g": 7, "sodium_mg": 50, "sugar_g": 1, "fiber_g": 1},
    "jalapeño": {"calories": 15, "protein_g": 0, "carbs_g": 3, "fat_g": 0, "sodium_mg": 200, "sugar_g": 1, "fiber_g": 1},
    "salsa": {"calories": 25, "protein_g": 1, "carbs_g": 5, "fat_g": 0, "sodium_mg": 180, "sugar_g": 3, "fiber_g": 1},
    "basil": {"calories": 5, "protein_g": 0, "carbs_g": 1, "fat_g": 0, "sodium_mg": 1, "sugar_g": 0, "fiber_g": 0},
    "mozzarella": {"calories": 85, "protein_g": 6, "carbs_g": 1, "fat_g": 6, "sodium_mg": 150, "sugar_g": 0, "fiber_g": 0},
    "parmesan": {"calories": 70, "protein_g": 6, "carbs_g": 1, "fat_g": 5, "sodium_mg": 220, "sugar_g": 0, "fiber_g": 0},
    "mushroom": {"calories": 25, "protein_g": 3, "carbs_g": 3, "fat_g": 0, "sodium_mg": 10, "sugar_g": 2, "fiber_g": 1},
    "broth": {"calories": 15, "protein_g": 2, "carbs_g": 1, "fat_g": 0, "sodium_mg": 400, "sugar_g": 0, "fiber_g": 0},
    "mirin": {"calories": 40, "protein_g": 0, "carbs_g": 8, "fat_g": 0, "sodium_mg": 10, "sugar_g": 7, "fiber_g": 0},
    "batter": {"calories": 120, "protein_g": 3, "carbs_g": 18, "fat_g": 4, "sodium_mg": 200, "sugar_g": 1, "fiber_g": 1},
    "chips": {"calories": 140, "protein_g": 2, "carbs_g": 18, "fat_g": 7, "sodium_mg": 180, "sugar_g": 0, "fiber_g": 2},
    "ice": {"calories": 40, "protein_g": 1, "carbs_g": 6, "fat_g": 1, "sodium_mg": 25, "sugar_g": 5, "fiber_g": 0},
    "sesame": {"calories": 50, "protein_g": 2, "carbs_g": 2, "fat_g": 4, "sodium_mg": 30, "sugar_g": 0, "fiber_g": 1},
    "saffron": {"calories": 10, "protein_g": 0, "carbs_g": 2, "fat_g": 0, "sodium_mg": 5, "sugar_g": 0, "fiber_g": 0},
    "mustard": {"calories": 15, "protein_g": 1, "carbs_g": 1, "fat_g": 1, "sodium_mg": 120, "sugar_g": 1, "fiber_g": 1},
    "curry": {"calories": 40, "protein_g": 2, "carbs_g": 5, "fat_g": 2, "sodium_mg": 280, "sugar_g": 2, "fiber_g": 1},
    "biscuit": {"calories": 80, "protein_g": 2, "carbs_g": 12, "fat_g": 3, "sodium_mg": 140, "sugar_g": 4, "fiber_g": 1},
}

# Longer keys first so "soy sauce" matches before "soy" if we add phrases.
_SORTED_KEYS = sorted(_INGREDIENT_PROFILES.keys(), key=len, reverse=True)

_KCAL_IN_TEXT = re.compile(r"(\d{2,4})\s*kcal", re.I)
_GRAMS_KCAL = re.compile(r"(\d{2,4})\s*g\s*/\s*(\d{2,4})\s*kcal", re.I)


@dataclass(slots=True)
class NutritionEstimate:
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    sodium_mg: int
    sugar_g: int
    fiber_g: int
    cooking_score: float
    is_likely_vegetarian: bool
    matched_ingredients: list[str]
    source: str  # "ingredients" | "text" | "hash"


def _match_ingredient_token(token: str) -> str | None:
    t = token.lower().strip()
    if len(t) < 3:
        return None
    for key in _SORTED_KEYS:
        if key in t or t in key:
            return key
    return None


def _parse_kcal_from_text(text: str) -> int | None:
    m = _KCAL_IN_TEXT.search(text)
    if m:
        return int(m.group(1))
    return None


def estimate_from_row(row: DishRow, *, idx: int = 0) -> NutritionEstimate:
    """Sum ingredient profiles; fall back to name-hash if nothing matched."""
    totals = {k: 0.0 for k in ("calories", "protein_g", "carbs_g", "fat_g", "sodium_mg", "sugar_g", "fiber_g")}
    matched: list[str] = []
    seen_keys: set[str] = set()

    tokens: list[str] = []
    for ing in row.ingredients:
        tokens.extend(re.split(r"[,/&]+", ing.lower()))
    if not tokens:
        tokens = re.split(r"[^\w]+", row.scoring_text.lower())

    for tok in tokens:
        tok = tok.strip()
        key = _match_ingredient_token(tok)
        if key is None or key in seen_keys:
            continue
        seen_keys.add(key)
        matched.append(key)
        prof = _INGREDIENT_PROFILES[key]
        for field in totals:
            totals[field] += float(prof.get(field, 0))

    text_blob = " ".join(
        x for x in [row.display_name, row.description or "", row.details or "", row.scoring_text] if x
    ).lower()

    if _parse_kcal_from_text(text_blob):
        kcal = _parse_kcal_from_text(text_blob)
        if kcal and totals["calories"] > 0:
            scale = kcal / totals["calories"]
            for field in totals:
                totals[field] *= scale
        elif kcal:
            totals["calories"] = float(kcal)

    if matched:
        cooking = _cooking_score_from_text(text_blob)
        return NutritionEstimate(
            calories=int(round(totals["calories"])),
            protein_g=int(round(totals["protein_g"])),
            carbs_g=int(round(totals["carbs_g"])),
            fat_g=int(round(totals["fat_g"])),
            sodium_mg=int(round(totals["sodium_mg"])),
            sugar_g=int(round(totals["sugar_g"])),
            fiber_g=int(round(totals["fiber_g"])),
            cooking_score=cooking,
            is_likely_vegetarian=_is_vegetarian(text_blob, matched),
            matched_ingredients=matched,
            source="ingredients",
        )

    return _hash_fallback(row.scoring_text, idx)


def _cooking_score_from_text(lower: str) -> float:
    cooking = 0.0
    if any(k in lower for k in ("fried", "deep-fried", "crispy", "tempura", "fritter")):
        cooking -= 0.9
    if any(k in lower for k in ("cream", "alfredo", "butter", "cheese sauce", "gravy", "batter")):
        cooking -= 0.35
    if any(k in lower for k in ("grilled", "steamed", "baked", "poached", "broiled")):
        cooking += 0.55
    if "salad" in lower or "bowl" in lower or "steamed" in lower:
        cooking += 0.25
    return max(-1.0, min(1.0, cooking))


def _is_vegetarian(lower: str, matched: list[str]) -> bool:
    meat = ("chicken", "beef", "pork", "fish", "salmon", "tuna", "shrimp", "egg")
    if any(m in lower or m in matched for m in meat):
        return False
    return True


def _hash_fallback(text: str, idx: int) -> NutritionEstimate:
    from app.ml.feature_engineering import extract_features

    f = extract_features(text, idx)
    return NutritionEstimate(
        calories=f.calories,
        protein_g=f.protein_g,
        carbs_g=f.carbs_g,
        fat_g=f.fat_g,
        sodium_mg=f.sodium_mg,
        sugar_g=f.sugar_g,
        fiber_g=f.fiber_g,
        cooking_score=f.cooking_score,
        is_likely_vegetarian=f.is_likely_vegetarian,
        matched_ingredients=[],
        source="hash",
    )
