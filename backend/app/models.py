from __future__ import annotations

import datetime as dt

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    goals: Mapped[UserGoals | None] = relationship(
        "UserGoals", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    health: Mapped[UserHealth | None] = relationship(
        "UserHealth", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    menu_scans: Mapped[list[MenuScan]] = relationship("MenuScan", back_populates="user", cascade="all, delete-orphan")
    saved_meals: Mapped[list[SavedMeal]] = relationship("SavedMeal", back_populates="user", cascade="all, delete-orphan")
    recommendation_runs: Mapped[list[RecommendationRun]] = relationship(
        "RecommendationRun", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    revoked_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")


class UserGoals(Base):
    __tablename__ = "user_goals"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    primary_goal: Mapped[str] = mapped_column(String(64), nullable=False, default="Weight loss")
    target_weight_kg: Mapped[str] = mapped_column(String(32), nullable=False, default="72")
    workouts_per_week: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    protein_g: Mapped[int] = mapped_column(Integer, nullable=False, default=120)
    carbs_g: Mapped[int] = mapped_column(Integer, nullable=False, default=180)
    fat_g: Mapped[int] = mapped_column(Integer, nullable=False, default=55)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="goals")


class UserHealth(Base):
    __tablename__ = "user_health"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    allergens: Mapped[list[str]] = mapped_column(JSON, nullable=False, server_default=text("'[]'"))
    diets: Mapped[list[str]] = mapped_column(JSON, nullable=False, server_default=text("'[]'"))
    max_sodium_mg: Mapped[int] = mapped_column(Integer, nullable=False, default=2000)
    max_sugar_g: Mapped[int] = mapped_column(Integer, nullable=False, default=40)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="health")


class MenuScan(Base):
    __tablename__ = "menu_scans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    input_mode: Mapped[str] = mapped_column(String(16), nullable=False)
    menu_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    upload_filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    restaurant_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cuisine_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dishes: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="menu_scans")
    recommendation_runs: Mapped[list[RecommendationRun]] = relationship(
        "RecommendationRun", back_populates="menu_scan", cascade="all, delete-orphan"
    )


class RecommendationRun(Base):
    __tablename__ = "recommendation_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    menu_scan_id: Mapped[int] = mapped_column(ForeignKey("menu_scans.id", ondelete="CASCADE"), index=True, nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    request_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False, server_default=text("'{}'"))
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="recommendation_runs")
    menu_scan: Mapped[MenuScan] = relationship("MenuScan", back_populates="recommendation_runs")
    results: Mapped[list[RecommendationResult]] = relationship(
        "RecommendationResult", back_populates="run", cascade="all, delete-orphan"
    )


class RecommendationResult(Base):
    __tablename__ = "recommendation_results"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("recommendation_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False)
    dish_name: Mapped[str] = mapped_column(String(512), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False)
    protein_g: Mapped[int] = mapped_column(Integer, nullable=False)
    carbs_g: Mapped[int] = mapped_column(Integer, nullable=False)
    fat_g: Mapped[int] = mapped_column(Integer, nullable=False)
    protein_fill: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_fill: Mapped[float] = mapped_column(Float, nullable=False)
    fat_fill: Mapped[float] = mapped_column(Float, nullable=False)
    why_match: Mapped[list] = mapped_column(JSON, nullable=False)
    smart_mods: Mapped[list] = mapped_column(JSON, nullable=False)
    feature_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, server_default=text("'{}'"))

    run: Mapped[RecommendationRun] = relationship("RecommendationRun", back_populates="results")


class SavedMeal(Base):
    __tablename__ = "saved_meals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    dish_name: Mapped[str] = mapped_column(String(512), nullable=False)
    restaurant: Mapped[str] = mapped_column(String(255), nullable=False)
    note: Mapped[str] = mapped_column(String(1024), nullable=False, default="")
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="saved_meals")
