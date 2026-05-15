"""Structured dish row from menu scans (name + optional description / ingredients)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class DishRow:
    display_name: str
    scoring_text: str
    ingredients: list[str] = field(default_factory=list)
    description: str | None = None
    details: str | None = None


def parse_dish_row(raw: Any) -> DishRow | None:
    if isinstance(raw, str):
        name = raw.strip()
        if not name:
            return None
        return DishRow(display_name=name, scoring_text=name, ingredients=[])

    if not isinstance(raw, dict):
        return None

    name = str(raw.get("name") or "").strip()
    if not name:
        return None

    ingredients: list[str] = []
    ing = raw.get("ingredients")
    if isinstance(ing, list):
        ingredients = [str(x).strip() for x in ing if str(x).strip()]

    desc = raw.get("description")
    description = desc.strip() if isinstance(desc, str) and desc.strip() else None

    det = raw.get("details")
    details = det.strip() if isinstance(det, str) and det.strip() else None

    parts: list[str] = [name]
    if description:
        parts.append(description)
    if ingredients:
        parts.append(", ".join(ingredients))
    if details:
        parts.append(details)

    return DishRow(
        display_name=name,
        scoring_text=" — ".join(parts),
        ingredients=ingredients,
        description=description,
        details=details,
    )


def rows_to_dish_rows(rows: list[Any]) -> list[DishRow]:
    out: list[DishRow] = []
    for raw in rows:
        row = parse_dish_row(raw)
        if row is not None:
            out.append(row)
    return out
