"""Apply Alembic migrations (used on API startup and via `python -m app.db_migrate`)."""

from __future__ import annotations

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect

from app.config import settings
from app.database import engine

logger = logging.getLogger(__name__)


def _alembic_config() -> Config:
    backend_root = Path(__file__).resolve().parents[1]
    cfg = Config(str(backend_root / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend_root / "alembic"))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    return cfg


def run_migrations() -> None:
    """Upgrade to head, or stamp head when legacy tables exist without alembic_version."""
    cfg = _alembic_config()
    script = ScriptDirectory.from_config(cfg)
    head = script.get_current_head()
    if not head:
        logger.warning("No Alembic revisions found; skipping migrations.")
        return

    with engine.connect() as conn:
        current = MigrationContext.configure(conn).get_current_revision()

    if current == head:
        logger.debug("Alembic already at head (%s).", head)
        return

    insp = inspect(engine)
    tables = set(insp.get_table_names())
    if "users" in tables and "alembic_version" not in tables:
        logger.info("Legacy schema detected (no alembic_version); stamping head.")
        command.stamp(cfg, "head")
        return

    logger.info("Applying Alembic migrations (%s -> %s).", current or "base", head)
    command.upgrade(cfg, "head")
    logger.info("Alembic migrations applied.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migrations()
