"""Lightweight SQLite migrations for dev installs without Alembic."""

from sqlalchemy import inspect, text

from app.config import settings
from app.database import engine


def run_sqlite_migrations() -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("users")}
    if "google_sub" in cols:
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR(255)"))
    with engine.begin() as conn:
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google_sub ON users (google_sub)"))
