"""Normalize stored scan rows into display + scoring text for the ranker."""

from __future__ import annotations

from typing import Any

from app.ml.dish_row import DishRow, parse_dish_row, rows_to_dish_rows


def scoring_text_from_row(raw: Any) -> str:
    """Rich text for ML / allergies: name + description + ingredients + details."""
    row = parse_dish_row(raw)
    if row is None:
        return ""
    return row.scoring_text


def display_name_from_row(raw: Any) -> str:
    row = parse_dish_row(raw)
    if row is None:
        return ""
    return row.display_name


def rows_to_rank_entries(rows: list[Any]) -> list[tuple[str, str]]:
    """(display_name, scoring_text) pairs; skips invalid rows."""
    out: list[tuple[str, str]] = []
    for row in rows_to_dish_rows(rows):
        out.append((row.display_name, row.scoring_text))
    return out


__all__ = ["DishRow", "rows_to_dish_rows", "rows_to_rank_entries", "scoring_text_from_row", "display_name_from_row"]
