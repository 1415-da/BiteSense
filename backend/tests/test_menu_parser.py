"""Parser tests use sample menu text (not production app constants)."""

from app.menu_extraction.parser import parse_menu_text


def test_parser_finds_priced_dishes_and_nutrition():
    text = """
SOCIAL SUBSTANTIALS

Social Spicy Spaghetti AOP (395): Spicy spaghetti in aglio e olio peperoncino sauce. (456g / 585 kcal)

Khichdi Aur Chaar Yaar (295): Served with ghee, dahi, papad, and achaar. (623g / 676 kcal)

Goan Prawn Curry (510): Coconut-based curry with rice. (638g / 770 kcal)
"""
    items = parse_menu_text(text)
    names = {x.name.lower() for x in items}
    assert "social spicy spaghetti aop" in names
    assert "khichdi aur chaar yaar" in names
    assert "goan prawn curry" in names
    curries = [x for x in items if "goan" in x.name.lower()]
    assert len(curries) == 1
    assert curries[0].details and "770" in curries[0].details
    assert curries[0].description and "coconut" in curries[0].description.lower()


def test_parser_trailing_dollar_price_with_dots():
    text = """
APPETIZERS

Chicken Tikka ........................ $12.99
Paneer Pakora ........................ $9.50
"""
    items = parse_menu_text(text)
    names = {x.name.lower() for x in items}
    assert "chicken tikka" in names
    assert "paneer pakora" in names


def test_parser_numbered_items():
    text = """
1. Margherita Pizza
2. Pepperoni Feast
3. Veggie Supreme
"""
    items = parse_menu_text(text)
    names = {x.name.lower() for x in items}
    assert "margherita pizza" in names
    assert len(items) >= 3


def test_parser_dish_ingredients_table_format():
    """Menus with 'Dish' / 'Ingredients Used' columns (PDF text layer)."""
    text = """
BiteSense Restaurant Menu
Indian Cuisine
Dish
Ingredients Used
Butter Chicken
Chicken, tomato gravy, butter, cream, spices
Paneer Tikka
Paneer, yogurt, bell peppers, onions, spices
Italian Cuisine
Dish
Ingredients Used
Margherita Pizza
Pizza dough, mozzarella, tomato sauce, basil
"""
    items = parse_menu_text(text)
    names = {x.name.lower() for x in items}
    assert "butter chicken" in names
    assert "paneer tikka" in names
    assert "margherita pizza" in names
    butter = next(x for x in items if x.name.lower() == "butter chicken")
    assert butter.ingredients
    assert any("tomato" in i.lower() for i in butter.ingredients)
