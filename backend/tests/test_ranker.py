from app.ml.ranker import GoalInputs, HealthInputs, rank_dishes


def test_rank_orders_by_score():
    goals = GoalInputs(
        primary_goal="Muscle gain",
        protein_target_g=150,
        carbs_target_g=200,
        fat_target_g=60,
    )
    health = HealthInputs(allergens=[], diets=[], max_sodium_mg=2400, max_sugar_g=50)
    dishes = [("Grilled Chicken Salad", "Grilled Chicken Salad"), ("Deep Fried Wings Platter", "Deep Fried Wings Platter"), ("Steamed Fish with Greens", "Steamed Fish with Greens")]
    ranked, filtered = rank_dishes(dishes, goals, health, top_n=3)
    assert filtered == 0
    assert len(ranked) == 3
    assert ranked[0].score >= ranked[1].score >= ranked[2].score


def test_allergen_filters():
    goals = GoalInputs(primary_goal="Weight loss", protein_target_g=120, carbs_target_g=180, fat_target_g=55)
    health = HealthInputs(allergens=["Shellfish"], diets=[], max_sodium_mg=2000, max_sugar_g=40)
    dishes = [("Garlic Shrimp Skillet", "Garlic Shrimp Skillet"), ("Steamed Broccoli", "Steamed Broccoli")]
    ranked, filtered = rank_dishes(dishes, goals, health, top_n=10)
    assert filtered == 1
    assert len(ranked) == 1
    assert "broccoli" in ranked[0].dish_name.lower()
