"""Normalize stored scan rows into display + scoring text for the ranker."""

from __future__ import annotations

from typing import Any


def scoring_text_from_row(raw: Any) -> str:
    """Rich text for ML / allergies: name + description + ingredients + details."""
    if isinstance(raw, str):
        return raw.strip()
    if not isinstance(raw, dict):
        return ""
    name = str(raw.get("name") or "").strip()
    parts: list[str] = []
    if name:
        parts.append(name)
    desc = raw.get("description")
    if isinstance(desc, str) and desc.strip():
        parts.append(desc.strip())
    ing = raw.get("ingredients")
    if isinstance(ing, list):
        joined = ", ".join(str(x).strip() for x in ing if str(x).strip())
        if joined:
            parts.append(joined)
    det = raw.get("details")
    if isinstance(det, str) and det.strip():
        parts.append(det.strip())
    return " — ".join(parts) if parts else name


def display_name_from_row(raw: Any) -> str:
    if isinstance(raw, str):
        return raw.strip()
    if isinstance(raw, dict):
        n = str(raw.get("name") or "").strip()
        return n
    return ""


def rows_to_rank_entries(rows: list[Any]) -> list[tuple[str, str]]:
    """(display_name, scoring_text) pairs; skips invalid rows."""
    out: list[tuple[str, str]] = []
    for raw in rows:
        display = display_name_from_row(raw)
        score_line = scoring_text_from_row(raw)
        if not display or not score_line:
            continue
        out.append((display, score_line))
    return out
