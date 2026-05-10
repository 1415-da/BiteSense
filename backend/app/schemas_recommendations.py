import datetime as dt

from pydantic import BaseModel, Field


class RecommendRankIn(BaseModel):
    scan_id: int | None = None
    top_n: int = Field(default=6, ge=1, le=50)


class RecommendationRowOut(BaseModel):
    id: str
    dish_name: str
    restaurant_label: str
    meal_type: str
    score: float
    rank: int
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    protein_fill: float
    carbs_fill: float
    fat_fill: float
    why_match: list[str]
    smart_mods: list[str]


class RecommendRankOut(BaseModel):
    run_id: int
    model_version: str
    restaurant_label: str
    location: str
    last_scan_at: dt.datetime
    confidence: int | None
    metrics: dict[str, object]
    rows: list[RecommendationRowOut]


class RecommendationHistoryItemOut(BaseModel):
    run_id: int
    menu_scan_id: int
    created_at: dt.datetime
    model_version: str
    metrics: dict[str, object]
    top_dish: str | None
    top_score: float | None


class RecommendationHistoryOut(BaseModel):
    items: list[RecommendationHistoryItemOut]
