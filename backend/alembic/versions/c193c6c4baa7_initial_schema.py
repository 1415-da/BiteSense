"""initial schema

Revision ID: c193c6c4baa7
Revises:
Create Date: 2026-05-12 16:36:18.749986

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c193c6c4baa7"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("google_sub", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("google_sub"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_google_sub", "users", ["google_sub"])

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])

    op.create_table(
        "user_goals",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("primary_goal", sa.String(64), nullable=False),
        sa.Column("target_weight_kg", sa.String(32), nullable=False),
        sa.Column("workouts_per_week", sa.Integer(), nullable=False),
        sa.Column("protein_g", sa.Integer(), nullable=False),
        sa.Column("carbs_g", sa.Integer(), nullable=False),
        sa.Column("fat_g", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "user_health",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("allergens", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("diets", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("max_sodium_mg", sa.Integer(), nullable=False),
        sa.Column("max_sugar_g", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "menu_scans",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("input_mode", sa.String(16), nullable=False),
        sa.Column("menu_url", sa.Text(), nullable=True),
        sa.Column("upload_filename", sa.String(512), nullable=True),
        sa.Column("restaurant_name", sa.String(255), nullable=True),
        sa.Column("cuisine_type", sa.String(255), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("confidence", sa.Integer(), nullable=True),
        sa.Column("dishes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_menu_scans_user_id", "menu_scans", ["user_id"])

    op.create_table(
        "recommendation_runs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("menu_scan_id", sa.Integer(), nullable=False),
        sa.Column("model_version", sa.String(32), nullable=False),
        sa.Column("request_snapshot", sa.JSON(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["menu_scan_id"], ["menu_scans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recommendation_runs_user_id", "recommendation_runs", ["user_id"])
    op.create_index("ix_recommendation_runs_menu_scan_id", "recommendation_runs", ["menu_scan_id"])

    op.create_table(
        "recommendation_results",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("run_id", sa.Integer(), nullable=False),
        sa.Column("rank_position", sa.Integer(), nullable=False),
        sa.Column("dish_name", sa.String(512), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("calories", sa.Integer(), nullable=False),
        sa.Column("protein_g", sa.Integer(), nullable=False),
        sa.Column("carbs_g", sa.Integer(), nullable=False),
        sa.Column("fat_g", sa.Integer(), nullable=False),
        sa.Column("protein_fill", sa.Float(), nullable=False),
        sa.Column("carbs_fill", sa.Float(), nullable=False),
        sa.Column("fat_fill", sa.Float(), nullable=False),
        sa.Column("why_match", sa.JSON(), nullable=False),
        sa.Column("smart_mods", sa.JSON(), nullable=False),
        sa.Column("feature_snapshot", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.ForeignKeyConstraint(["run_id"], ["recommendation_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recommendation_results_run_id", "recommendation_results", ["run_id"])

    op.create_table(
        "saved_meals",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("dish_name", sa.String(512), nullable=False),
        sa.Column("restaurant", sa.String(255), nullable=False),
        sa.Column("note", sa.String(1024), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saved_meals_user_id", "saved_meals", ["user_id"])


def downgrade() -> None:
    op.drop_table("recommendation_results")
    op.drop_table("recommendation_runs")
    op.drop_table("saved_meals")
    op.drop_table("menu_scans")
    op.drop_table("user_health")
    op.drop_table("user_goals")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
