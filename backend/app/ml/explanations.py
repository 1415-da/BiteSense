"""Human-readable why-match lines and smart mods from dish features + user profile."""

from __future__ import annotations

from dataclasses import dataclass

from app.ml.feature_engineering import DishFeatures
from app.ml.scoring import GoalInputs, HealthInputs, macro_fills


@dataclass(slots=True)
class ExplanationContext:
    rank_among_scan: int  # 1 = best on this menu
    total_ranked: int
    protein_rank: int  # 1 = highest protein on menu


def build_why_lines(
    f: DishFeatures,
    goals: GoalInputs,
    health: HealthInputs,
    score: float,
    *,
    ctx: ExplanationContext | None = None,
) -> list[str]:
    lines: list[str] = []
    goal_l = (goals.primary_goal or "").lower()
    pf, cf, ff = macro_fills(f, goals)
    meal_p = max(1, int(goals.protein_target_g / 3))
    meal_na = max(1, int(health.max_sodium_mg / 3))
    meal_su = max(1, int(health.max_sugar_g / 3))

    if ctx and ctx.rank_among_scan == 1:
        lines.append(f"Top pick on this menu for your {goals.primary_goal} setup (score {score:.0f}).")
    elif score >= 75:
        lines.append(f"Strong match (score {score:.0f}) for {goals.primary_goal}.")
    elif score >= 55:
        lines.append(f"Solid option (score {score:.0f}) with some tradeoffs vs your daily targets.")
    else:
        lines.append(f"Moderate fit (score {score:.0f}) — review macros before ordering.")

    if f.estimate_source == "ingredients" and f.matched_ingredients:
        shown = ", ".join(f.matched_ingredients[:4])
        if len(f.matched_ingredients) > 4:
            shown += f" (+{len(f.matched_ingredients) - 4} more)"
        lines.append(f"Estimated from menu ingredients: {shown}.")

    if pf >= 85:
        lines.append(f"High protein (~{f.protein_g}g, ~{pf:.0f}% of your ~{meal_p}g per-meal target).")
    elif f.protein_g >= 20:
        lines.append(f"Provides ~{f.protein_g}g protein (~{pf:.0f}% of per-meal target).")

    if ctx and ctx.protein_rank == 1 and f.protein_g >= 18:
        lines.append("Highest protein option among dishes on this scan.")

    if f.sodium_mg <= int(meal_na * 0.75):
        lines.append(f"Lower sodium (~{f.sodium_mg}mg vs ~{meal_na}mg meal budget).")
    elif f.sodium_mg > meal_na:
        lines.append(f"Higher sodium (~{f.sodium_mg}mg) — consider sauce on the side.")

    if f.sugar_g <= int(meal_su * 0.7):
        lines.append(f"Moderate sugar (~{f.sugar_g}g) for a single dish.")

    if "muscle" in goal_l and f.protein_g >= 25:
        lines.append("Protein-forward — aligned with muscle-oriented goals.")
    if "weight" in goal_l and "loss" in goal_l and f.calories <= 550:
        lines.append(f"Reasonable calorie load (~{f.calories} kcal) for weight management.")
    if "keto" in " ".join(d.lower() for d in health.diets).lower() and f.carbs_g <= 25:
        lines.append(f"Lower carbs (~{f.carbs_g}g) — fits keto-style preferences.")

    diets_l = " ".join(d.lower() for d in health.diets)
    if "vegetarian" in diets_l and f.is_likely_vegetarian:
        lines.append("Vegetarian-friendly based on listed ingredients.")
    if "vegan" in diets_l and f.is_likely_vegetarian and not _has_dairy(f):
        lines.append("Plant-based ingredients — may fit vegan preferences (confirm preparation).")

    if f.cooking_score >= 0.35:
        lines.append("Preparation cues (grilled/steamed/baked) lean lighter.")
    elif f.cooking_score <= -0.5:
        lines.append("Heavier preparation style — balance with lighter sides.")

    if cf >= 90 and "weight" not in goal_l:
        lines.append(f"Carbs (~{f.carbs_g}g) are high relative to your per-meal carb target.")

    if not lines:
        lines.append("Balanced against your macro guardrails for this meal.")

    return _dedupe_lines(lines)[:5]


def build_mods(
    f: DishFeatures,
    goals: GoalInputs,
    health: HealthInputs,
) -> list[str]:
    mods: list[str] = []
    lower = f.scoring_blob_lower()
    goal_l = (goals.primary_goal or "").lower()
    ingredients_l = " ".join(f.ingredients).lower() if f.ingredients else lower

    if f.sodium_mg > 700 or "soy sauce" in ingredients_l or "sauce" in f.matched_ingredients:
        mods.append("Ask for sauce, gravy, or dressing on the side to cut sodium.")
    if "fried" in lower or "crispy" in lower or "tempura" in lower or "batter" in f.matched_ingredients:
        mods.append("Request grilled, steamed, or baked instead of fried if the kitchen allows.")
    if f.sugar_g > 18 or "sugar" in f.matched_ingredients or "honey" in ingredients_l:
        mods.append("Skip sugary drinks or dessert with this dish to keep sugar down.")
    if f.carbs_g > 65 or "rice" in f.matched_ingredients or "pasta" in f.matched_ingredients:
        mods.append("Swap half the rice/pasta for extra vegetables or salad.")
    if "cream" in ingredients_l or "butter" in ingredients_l or "cheese" in f.matched_ingredients:
        mods.append("Ask for light cheese/cream or a half portion of rich sauce.")
    if "weight" in goal_l and "loss" in goal_l and f.calories > 600:
        mods.append("Consider a smaller portion or share — calorie estimate is on the higher side.")
    if "muscle" in goal_l and f.protein_g < 22:
        mods.append("Add a lean protein side (eggs, grilled chicken, or legumes) to hit protein goals.")
    if health.allergens:
        mods.append(
            f"Confirm with staff about {', '.join(health.allergens[:2])}"
            + ("…" if len(health.allergens) > 2 else "")
            + " — menu text may not list all allergens."
        )
    if "tortilla" in f.matched_ingredients or "bread" in f.matched_ingredients:
        mods.append("Try a bowl-style serving without extra bread if available.")

    if not mods:
        mods.append("Pair with vegetables and water; adjust portion to ~⅓ protein on your plate.")

    return _dedupe_lines(mods)[:4]


def _has_dairy(f: DishFeatures) -> bool:
    dairy = ("milk", "cream", "cheese", "butter", "yogurt", "paneer")
    blob = f.scoring_blob_lower()
    return any(d in blob or d in f.matched_ingredients for d in dairy)


def _dedupe_lines(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for ln in lines:
        key = ln.strip().lower()
        if key and key not in seen:
            seen.add(key)
            out.append(ln.strip())
    return out
