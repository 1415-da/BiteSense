import datetime as dt
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str

    model_config = {"from_attributes": True}


class ProfilePatch(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip()


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class GoalsIn(BaseModel):
    primary_goal: str = Field(min_length=1, max_length=64)
    target_weight_kg: str = Field(min_length=1, max_length=32)
    workouts_per_week: int = Field(ge=0, le=14)
    protein_g: int = Field(ge=30, le=400)
    carbs_g: int = Field(ge=40, le=600)
    fat_g: int = Field(ge=15, le=200)


class GoalsOut(BaseModel):
    primary_goal: str
    target_weight_kg: str
    workouts_per_week: int
    protein_g: int
    carbs_g: int
    fat_g: int


class HealthIn(BaseModel):
    allergens: list[str] = Field(default_factory=list)
    diets: list[str] = Field(default_factory=list)
    max_sodium_mg: int = Field(ge=800, le=4000)
    max_sugar_g: int = Field(ge=5, le=120)


class HealthOut(BaseModel):
    allergens: list[str]
    diets: list[str]
    max_sodium_mg: int
    max_sugar_g: int


class MenuScanCreate(BaseModel):
    input_mode: Literal["url", "image", "pdf"]
    menu_url: str | None = None
    upload_filename: str | None = Field(default=None, max_length=512)
    restaurant_name: str | None = Field(default=None, max_length=255)
    cuisine_type: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    confidence: int | None = Field(default=None, ge=0, le=100)
    dishes: list[str] = Field(min_length=1)


class MenuScanDishesPatch(BaseModel):
    dishes: list[str] = Field(min_length=1)


class MenuScanOut(BaseModel):
    id: int
    input_mode: str
    menu_url: str | None
    upload_filename: str | None
    restaurant_name: str | None
    cuisine_type: str | None
    location: str | None
    confidence: int | None
    dishes: list[str]
    scanned_at: dt.datetime


class MenuScanSummary(BaseModel):
    id: int
    restaurant_label: str
    location_label: str
    scanned_at: dt.datetime
    item_count: int
    confidence: int | None


class SavedMealCreate(BaseModel):
    dish_name: str = Field(min_length=1, max_length=512)
    restaurant: str = Field(min_length=1, max_length=255)
    note: str = Field(default="", max_length=1024)


class SavedMealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dish_name: str
    restaurant: str
    note: str
    created_at: dt.datetime

