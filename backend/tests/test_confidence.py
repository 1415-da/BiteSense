from app.menu_extraction.parser import confidence_score, parse_menu_text


def test_confidence_increases_with_items_and_structure():
    text = """
Social Spicy Spaghetti AOP (395): Spicy spaghetti. (456g / 585 kcal)
Khichdi Aur Chaar Yaar (295): Served with ghee. (623g / 676 kcal)
"""
    items = parse_menu_text(text)
    assert len(items) >= 1
    c = confidence_score(text, len(items))
    assert 40 <= c <= 100


def test_confidence_no_items_uses_text_length_only():
    c = confidence_score("x" * 200, 0)
    assert c <= 48


def test_confidence_multi_item_typical_range():
    text = """
Social Spicy Spaghetti AOP (395): Spicy spaghetti. (456g / 585 kcal)
Khichdi Aur Chaar Yaar (295): Served with ghee. (623g / 676 kcal)
"""
    items = parse_menu_text(text)
    assert len(items) >= 2
    c = confidence_score(text, len(items))
    assert 58 <= c <= 100
