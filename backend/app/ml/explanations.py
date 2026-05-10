"""Human-readable reasons and modification hints from features + scores."""

from __future__ import annotations

from app.ml.feature_engineering import DishFeatures
from app.ml.scoring import GoalInputs, HealthInputs


def build_why_lines(
    f: DishFeatures,
    goals: GoalInputs,
    health: HealthInputs,
    score: float,
) -> list[str]:
    lines: list[str] = []
    goal_l = goals.primary_goal.lower()
    if score >= 75:
        lines.append(f"Strong overall match (score {score:.0f}) for your {goals.primary_goal.lower()} setup.")
    elif score >= 55:
        lines.append(f"Reasonable fit (score {score:.0f}) with a few tradeoffs vs daily targets.")

    if f.protein_g >= 25:
        lines.append(f"Solid protein ({f.protein_g}g) vs your per-meal protein budget.")
    if f.sodium_mg <= int(health.max_sodium_mg / 3 * 0.85):
        lines.append("Sodium looks lighter than many typical restaurant plates.")
    if f.sugar_g <= int(health.max_sugar_g / 3 * 0.85):
        lines.append("Sugar load is restrained for a single dish.")
    if f.cooking_score >= 0.3:
        lines.append("Preparation language skews toward lighter cooking styles.")
    if "muscle" in goal_l and f.protein_g >= 30:
        lines.append("Protein-forward — aligned with muscle-oriented goals.")

    if not lines:
        lines.append("Balanced against your macro guardrails for this meal slot.")

    return lines[:5]


def build_mods(f: DishFeatures) -> list[str]:
    mods: list[str] = []
    lower = f.name.lower()
    if f.sodium_mg > 900:
        mods.append("Ask for sauce or dressing on the side to cut sodium.")
    if "fried" in lower or "crispy" in lower:
        mods.append("Request grilled or baked preparation if available.")
    if f.sugar_g > 20:
        mods.append("Skip sweet glazes or sugary beverages with this dish.")
    if f.carbs_g > 70:
        mods.append("Swap a starchy side for extra vegetables when possible.")
    if not mods:
        mods.append("Portion to ~⅓ plate protein, ½ vegetables when served family-style.")
    return mods[:4]
