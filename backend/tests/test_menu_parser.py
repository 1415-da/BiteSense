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
