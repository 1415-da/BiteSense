"""Heuristic parser: raw menu text -> structured dish rows (no hardcoded menu items)."""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class ParsedItem:
    name: str
    description: str | None = None
    ingredients: list[str] = field(default_factory=list)
    details: str | None = None


# "(456g / 585 kcal)" or "623g/676 kcal"
_NUTRITION_RE = re.compile(
    r"\(?\s*(\d{2,4})\s*g\s*/\s*(\d{2,4})\s*kcal\s*\)?",
    re.IGNORECASE,
)
# Leading dish line with rupee-style or menu price in parens at end: Name (395) or Name (395): rest
_DISH_WITH_PRICE = re.compile(
    r"^\s*(.+?)\s*\((\d{2,4})\)\s*:?\s*(.*)$",
)
# Section headers: ALL CAPS short line, or markdown ###
_SECTION_LIKE = re.compile(r"^\s*#*\s*([A-Z][A-Z0-9\s&\-',]{4,80})\s*$")


def _strip_bullets(s: str) -> str:
    return re.sub(r"^\s*[\-*•]+\s*", "", s).strip()


def _extract_nutrition_blob(text: str) -> tuple[str, str | None]:
    """Remove nutrition parenthetical from text; return (remainder, nutrition string)."""
    m = _NUTRITION_RE.search(text)
    if not m:
        return text.strip(), None
    nutrition = f"{m.group(1)}g / {m.group(2)} kcal"
    without = text[: m.start()] + text[m.end() :]
    return re.sub(r"\s+", " ", without).strip(" -–—,.;"), nutrition


def _split_ingredient_like(description: str) -> tuple[str, list[str]]:
    """Light heuristic: optional add-ons line -> ingredients."""
    if not description:
        return "", []
    lower = description.lower()
    ingredients: list[str] = []
    if "option" in lower or "add " in lower or " toppings" in lower:
        # keep full line in description; tag tail as ingredient-like fragments
        pass
    # Prose descriptions often list main items with commas — do not over-split
    return description, ingredients


def parse_menu_text(text: str) -> list[ParsedItem]:
    if not text or not text.strip():
        return []

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [_strip_bullets(ln) for ln in normalized.split("\n")]
    lines = [ln for ln in lines if ln.strip()]

    items: list[ParsedItem] = []
    i = 0

    def is_section_line(ln: str) -> bool:
        s = ln.strip()
        if len(s) < 6 or len(s) > 90:
            return False
        if _SECTION_LIKE.match(s):
            return True
        letters = sum(1 for c in s if c.isalpha())
        up = sum(1 for c in s if c.isupper())
        return letters > 4 and up / max(letters, 1) > 0.65 and not _DISH_WITH_PRICE.match(s)

    def looks_like_new_dish(ln: str) -> bool:
        if is_section_line(ln):
            return False
        if _DISH_WITH_PRICE.match(ln):
            return True
        # OCR line without price: starts with capital, reasonable length, next line might be description
        if 8 <= len(ln) <= 120 and ln[0].isupper():
            if re.search(r"\(\d{2,4}\)", ln):
                return True
        return False

    while i < len(lines):
        ln = lines[i]

        if is_section_line(ln):
            i += 1
            continue

        m = _DISH_WITH_PRICE.match(ln)
        if m:
            name = re.sub(r"\s+", " ", m.group(1)).strip()
            # price = m.group(2)  # not stored as dish name
            tail = re.sub(r"\s+", " ", m.group(3).strip())
            desc_lines: list[str] = []
            if tail:
                desc_lines.append(tail)
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if looks_like_new_dish(nxt) or is_section_line(nxt):
                    break
                desc_lines.append(nxt)
                i += 1
            full_desc = " ".join(desc_lines)
            full_desc, nut = _extract_nutrition_blob(full_desc)
            desc_out, ing = _split_ingredient_like(full_desc)
            details_parts: list[str] = []
            if nut:
                details_parts.append(nut)
            details = " · ".join(details_parts) if details_parts else None
            if name:
                items.append(
                    ParsedItem(
                        name=name[:512],
                        description=desc_out[:2000] if desc_out else None,
                        ingredients=ing,
                        details=details,
                    )
                )
            continue

        # Try pair: title line + body without price on first line (weak)
        if (
            i + 1 < len(lines)
            and 6 <= len(ln) <= 100
            and not ln.endswith(":")
            and lines[i + 1]
            and not looks_like_new_dish(lines[i + 1])
            and not is_section_line(lines[i + 1])
        ):
            next_ln = lines[i + 1]
            if len(next_ln) > 15 and (next_ln[0].islower() or next_ln[:3].islower()):
                name = re.sub(r"\s+", " ", ln).strip()
                i += 1
                desc_lines = [next_ln]
                i += 1
                while i < len(lines):
                    nxt = lines[i]
                    if looks_like_new_dish(nxt) or is_section_line(nxt):
                        break
                    desc_lines.append(nxt)
                    i += 1
                full_desc = " ".join(desc_lines)
                full_desc, nut = _extract_nutrition_blob(full_desc)
                desc_out, ing = _split_ingredient_like(full_desc)
                details = nut
                items.append(
                    ParsedItem(
                        name=name[:512],
                        description=desc_out[:2000] if desc_out else None,
                        ingredients=ing,
                        details=details,
                    )
                )
                continue

        i += 1

    # De-duplicate by name (keep first)
    seen: set[str] = set()
    unique: list[ParsedItem] = []
    for it in items:
        key = it.name.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(it)
    return unique


def confidence_score(raw_text: str, item_count: int) -> int:
    """
    Heuristic parse-quality score 0–100: dish count, text length, price-line and nutrition
    structure cues (not model softmax). Tuned so typical successful scans land ~65–88.
    """
    text = raw_text.strip()
    if item_count <= 0:
        return max(0, min(48, len(text) // 90))

    lines = [ln.strip() for ln in text.replace("\r", "\n").split("\n") if ln.strip()]
    price_line_hits = sum(1 for ln in lines if _DISH_WITH_PRICE.match(ln))
    nutrition_hits = len(_NUTRITION_RE.findall(text))

    # Strong signal: number of structured dishes recovered
    # Calibrated so a typical 2–6 dish menu lands roughly in the mid-60s–90 when OCR is decent.
    item_part = 36.0 + min(32.0, item_count * 2.2)

    # OCR / PDF completeness
    text_part = min(20.0, len(text) / 320.0)

    # Menu structure: prices in margin, kcal lines
    structure_part = 0.0
    structure_part += min(14.0, max(0.0, price_line_hits * 2.2))
    structure_part += min(10.0, max(0.0, nutrition_hits * 2.5))
    if price_line_hits and item_count:
        agree = min(price_line_hits, item_count) / max(price_line_hits, item_count)
        structure_part += agree * 12.0

    total = int(round(item_part + text_part + min(28.0, structure_part)))
    return min(100, max(18, total))
