from app.ml.dish_row import DishRow
from app.ml.explanations import ExplanationContext, build_mods, build_why_lines
from app.ml.feature_engineering import extract_features_from_row
from app.ml.nutrition_estimate import estimate_from_row
from app.ml.ranker import GoalInputs, HealthInputs, rank_dishes
from app.ml.scoring import score_dish


def test_ingredient_estimate_butter_chicken():
    row = DishRow(
        display_name="Butter Chicken",
        scoring_text="Butter Chicken — Chicken, tomato gravy, butter, cream, spices",
        ingredients=["Chicken", "tomato gravy", "butter", "cream", "spices"],
    )
    est = estimate_from_row(row)
    assert est.source == "ingredients"
    assert "chicken" in est.matched_ingredients
    assert est.protein_g >= 20


def test_why_lines_reference_ingredients():
    row = DishRow(
        display_name="Paneer Tikka",
        scoring_text="Paneer Tikka — Paneer, yogurt, bell peppers",
        ingredients=["Paneer", "yogurt", "bell peppers"],
    )
    feat = extract_features_from_row(row)
    goals = GoalInputs(primary_goal="Muscle gain", protein_target_g=150, carbs_target_g=200, fat_target_g=60)
    health = HealthInputs(allergens=[], diets=[], max_sodium_mg=2400, max_sugar_g=50)
    score = score_dish(feat, goals, health)
    why = build_why_lines(feat, goals, health, score, ctx=ExplanationContext(1, 3, 1))
    assert any("ingredient" in w.lower() or "protein" in w.lower() for w in why)
    mods = build_mods(feat, goals, health)
    assert len(mods) >= 1


def test_rank_dishes_with_structured_rows():
    rows = [
        DishRow(
            display_name="Butter Chicken",
            scoring_text="Butter Chicken — Chicken, tomato, butter, cream",
            ingredients=["Chicken", "tomato", "butter", "cream"],
        ),
        DishRow(
            display_name="Margherita Pizza",
            scoring_text="Margherita Pizza — Pizza dough, mozzarella, tomato sauce",
            ingredients=["Pizza dough", "mozzarella", "tomato sauce"],
        ),
    ]
    goals = GoalInputs(primary_goal="Weight loss", protein_target_g=120, carbs_target_g=180, fat_target_g=55)
    health = HealthInputs(allergens=[], diets=[], max_sodium_mg=2000, max_sugar_g=40)
    ranked, filtered, blend = rank_dishes(rows, goals, health, top_n=2)
    assert filtered == 0
    assert len(ranked) == 2
    assert ranked[0].why_match
    assert ranked[0].smart_mods
    assert blend.get("llm_explanations") is False or isinstance(blend.get("llm_explanations"), bool)
