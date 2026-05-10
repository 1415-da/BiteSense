"""Weighted health scoring from goals + guardrails (hybrid v1)."""

from __future__ import annotations

import math
from dataclasses import dataclass

from app.ml.feature_engineering import DishFeatures


@dataclass(slots=True)
class GoalInputs:
    primary_goal: str
    protein_target_g: int
    carbs_target_g: int
    fat_target_g: int


@dataclass(slots=True)
class HealthInputs:
    allergens: list[str]
    diets: list[str]
    max_sodium_mg: int
    max_sugar_g: int


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _meal_fraction() -> float:
    """Assume one meal ~= 1/3 of daily targets."""
    return 1.0 / 3.0


def score_dish(f: DishFeatures, goals: GoalInputs, health: HealthInputs) -> float:
    """Return 0-100 composite score."""
    mf = _meal_fraction()
    p_target = max(1, int(goals.protein_target_g * mf))
    c_target = max(1, int(goals.carbs_target_g * mf))
    f_target = max(1, int(goals.fat_target_g * mf))
    na_cap = max(1, int(health.max_sodium_mg * mf))
    su_cap = max(1, int(health.max_sugar_g * mf))

    # Protein alignment (higher weight for muscle / performance)
    p_ratio = f.protein_g / p_target
    protein_fit = 1.0 - abs(math.log(max(0.4, min(2.5, p_ratio))))
    protein_fit = _clamp01(protein_fit)

    goal_l = goals.primary_goal.lower()
    w_protein = 0.22
    w_carb = 0.14
    w_cal = 0.18
    w_na = 0.16
    w_su = 0.14
    w_fat = 0.08
    w_fiber = 0.06
    w_cook = 0.12

    if "muscle" in goal_l or "athletic" in goal_l:
        w_protein = 0.32
        w_cal = 0.12
    if "weight" in goal_l and "loss" in goal_l:
        w_cal = 0.26
        w_carb = 0.18
    if "keto" in " ".join(health.diets).lower():
        w_carb = 0.28
        w_fat = 0.12

    # Calories vs rough meal budget based on goal
    cal_target = 450 + (hash(f.name) % 200)
    if "weight" in goal_l and "loss" in goal_l:
        cal_target = 420
    cal_score = 1.0 - min(1.0, abs(f.calories - cal_target) / max(1.0, cal_target))

    carb_ratio = f.carbs_g / max(1, c_target)
    carb_score = 1.0 - min(1.0, abs(math.log(max(0.35, min(2.2, carb_ratio)))))

    fat_ratio = f.fat_g / max(1, f_target)
    fat_score = 1.0 - min(1.0, abs(math.log(max(0.4, min(2.2, fat_ratio)))))

    na_score = 1.0 - min(1.0, f.sodium_mg / max(1.0, float(na_cap)))
    su_score = 1.0 - min(1.0, f.sugar_g / max(1.0, float(su_cap)))
    fiber_score = _clamp01(f.fiber_g / 12.0)
    cook_score = (f.cooking_score + 1.0) / 2.0

    comp = (
        w_protein * protein_fit
        + w_carb * carb_score
        + w_cal * cal_score
        + w_na * na_score
        + w_su * su_score
        + w_fat * fat_score
        + w_fiber * fiber_score
        + w_cook * cook_score
    )
    return round(min(100.0, max(0.0, comp * 100.0)), 2)


def macro_fills(f: DishFeatures, goals: GoalInputs) -> tuple[float, float, float]:
    mf = _meal_fraction()
    p_t = max(1, int(goals.protein_target_g * mf))
    c_t = max(1, int(goals.carbs_target_g * mf))
    f_t = max(1, int(goals.fat_target_g * mf))
    return (
        min(100.0, 100.0 * f.protein_g / p_t),
        min(100.0, 100.0 * f.carbs_g / c_t),
        min(100.0, 100.0 * f.fat_g / f_t),
    )
