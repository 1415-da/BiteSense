"""Optional LLM polish for why_match / smart_mods (OpenAI-compatible API)."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import settings
from app.ml.explanations import build_mods, build_why_lines
from app.ml.explanations import ExplanationContext
from app.ml.feature_engineering import DishFeatures
from app.ml.scoring import GoalInputs, HealthInputs

logger = logging.getLogger(__name__)


def _rule_based(
    f: DishFeatures,
    goals: GoalInputs,
    health: HealthInputs,
    score: float,
    ctx: ExplanationContext | None,
) -> tuple[list[str], list[str]]:
    return (
        build_why_lines(f, goals, health, score, ctx=ctx),
        build_mods(f, goals, health),
    )


def enhance_explanations_batch(
    dishes: list[dict[str, Any]],
    goals: GoalInputs,
    health: HealthInputs,
) -> list[tuple[list[str], list[str]]]:
    """
    For each dish dict (features, score, ctx fields), return (why_match, smart_mods).
    Uses LLM when configured; otherwise rule-based only.
    """
    if not settings.openai_api_key.strip() or not settings.bitesense_llm_explanations:
        out: list[tuple[list[str], list[str]]] = []
        for d in dishes:
            f: DishFeatures = d["features"]
            ctx: ExplanationContext | None = d.get("ctx")
            out.append(_rule_based(f, goals, health, float(d["score"]), ctx))
        return out

    try:
        return _llm_batch(dishes, goals, health)
    except Exception as exc:
        logger.warning("LLM explanations failed, using rules: %s", exc)
        out = []
        for d in dishes:
            f = d["features"]
            ctx = d.get("ctx")
            out.append(_rule_based(f, goals, health, float(d["score"]), ctx))
        return out


def _llm_batch(
    dishes: list[dict[str, Any]],
    goals: GoalInputs,
    health: HealthInputs,
) -> list[tuple[list[str], list[str]]]:
    payload_items = []
    for i, d in enumerate(dishes):
        f: DishFeatures = d["features"]
        rb_why, rb_mods = _rule_based(f, goals, health, float(d["score"]), d.get("ctx"))
        payload_items.append(
            {
                "index": i,
                "dish_name": f.name,
                "ingredients": f.ingredients[:12],
                "estimated_macros": {
                    "calories": f.calories,
                    "protein_g": f.protein_g,
                    "carbs_g": f.carbs_g,
                    "fat_g": f.fat_g,
                    "sodium_mg": f.sodium_mg,
                },
                "score": float(d["score"]),
                "user_goal": goals.primary_goal,
                "protein_target_g": goals.protein_target_g,
                "diets": health.diets,
                "allergens": health.allergens,
                "rule_why": rb_why,
                "rule_mods": rb_mods,
            }
        )

    system = (
        "You are a nutrition coach for restaurant menus. "
        "Return ONLY valid JSON: {\"dishes\":[{\"index\":0,\"why_match\":[\"...\"],\"smart_mods\":[\"...\"]}]}. "
        "Each dish: 2-3 why_match bullets, 2 smart_mods. "
        "Use ONLY facts from estimated_macros, ingredients, and user profile. "
        "Do not invent calories or medical claims. Keep each line under 120 characters."
    )
    user = json.dumps({"dishes": payload_items}, ensure_ascii=False)

    url = f"{settings.openai_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key.strip()}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.openai_model,
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }

    with httpx.Client(timeout=settings.openai_timeout_seconds, trust_env=False) as client:
        r = client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()

    content = data["choices"][0]["message"]["content"]
    parsed = json.loads(content)
    by_index: dict[int, tuple[list[str], list[str]]] = {}

    for row in parsed.get("dishes") or []:
        if not isinstance(row, dict):
            continue
        idx = int(row.get("index", -1))
        why = [str(x).strip() for x in (row.get("why_match") or []) if str(x).strip()][:5]
        mods = [str(x).strip() for x in (row.get("smart_mods") or []) if str(x).strip()][:4]
        if idx >= 0 and why and mods:
            by_index[idx] = (why, mods)

    results: list[tuple[list[str], list[str]]] = []
    for i, d in enumerate(dishes):
        if i in by_index:
            results.append(by_index[i])
        else:
            f = d["features"]
            results.append(_rule_based(f, goals, health, float(d["score"]), d.get("ctx")))
    return results


def merge_llm_with_rules(
    llm_why: list[str],
    llm_mods: list[str],
    rule_why: list[str],
    rule_mods: list[str],
) -> tuple[list[str], list[str]]:
    """Prefer LLM lines; pad with rules if too short."""
    why = list(llm_why) if llm_why else []
    mods = list(llm_mods) if llm_mods else []
    for w in rule_why:
        if len(why) >= 5:
            break
        if w.lower() not in {x.lower() for x in why}:
            why.append(w)
    for m in rule_mods:
        if len(mods) >= 4:
            break
        if m.lower() not in {x.lower() for x in mods}:
            mods.append(m)
    return why[:5], mods[:4]
