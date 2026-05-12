import logging
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.redis_client import redis_ping_ok
from app.routers.auth import router as auth_router
from app.routers.me import router as me_router
from app.routers.recommendations import router as recommendations_router
from app.routers.saved_meals import router as saved_meals_router
from app.routers.scans import router as scans_router

logger = logging.getLogger(__name__)


def _run_alembic_upgrade() -> None:
    """Apply all pending Alembic migrations (equivalent to `alembic upgrade head`)."""
    backend_root = Path(__file__).resolve().parents[1]
    ini_path = backend_root / "alembic.ini"
    cfg = Config(str(ini_path))
    cfg.set_main_option("script_location", str(backend_root / "alembic"))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(cfg, "head")
    logger.info("Alembic migrations applied (upgrade head).")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _run_alembic_upgrade()
    yield


app = FastAPI(title="Bite Sense API", version="0.1.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(me_router, prefix="/api/v1")
app.include_router(scans_router, prefix="/api/v1")
app.include_router(saved_meals_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1")


@app.get("/health")
def health():
    out: dict[str, object] = {"status": "ok"}
    rp = redis_ping_ok()
    if rp is None:
        out["redis"] = "disabled"
    else:
        out["redis"] = "ok" if rp else "error"
    return out


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)
