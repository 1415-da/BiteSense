from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Single `.env` at repository root (same file Vite uses).
_REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        extra="ignore",
    )

    database_url: str = Field(
        default="sqlite:///./bitesense.db",
        validation_alias=AliasChoices("DATABASE_URL"),
    )
    jwt_secret_key: str = Field(
        default="dev-only-change-in-production-use-openssl-rand-hex-32",
        validation_alias=AliasChoices("JWT_SECRET_KEY"),
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(
        default=15,
        validation_alias=AliasChoices("ACCESS_TOKEN_EXPIRE_MINUTES"),
    )
    refresh_token_expire_days: int = Field(
        default=7,
        validation_alias=AliasChoices("REFRESH_TOKEN_EXPIRE_DAYS"),
    )

    cors_allowed_origins: str = Field(
        default="http://127.0.0.1:5173,http://localhost:5173",
        validation_alias=AliasChoices("CORS_ALLOWED_ORIGINS"),
    )

    #: When set, requests with matching header `X-ML-Internal-Secret` can read `/recommendations/metrics*` without JWT (Docker ml-flow only).
    ml_metrics_internal_secret: str | None = Field(
        default=None,
        validation_alias=AliasChoices("ML_METRICS_INTERNAL_SECRET"),
    )

    #: Path to joblib-pickled sklearn ensemble (`BITESENSE_ML_EXPORT_PATH` from training). Empty = heuristic-only.
    bitesense_ml_ensemble_path: str = Field(default="", validation_alias=AliasChoices("BITESENSE_ML_ENSEMBLE_PATH"))
    #: final = w * heuristic + (1-w) * surrogate. Only applies when ensemble loads successfully.
    bitesense_ml_blend_heuristic: float = Field(
        default=0.55,
        ge=0.0,
        le=1.0,
        validation_alias=AliasChoices("BITESENSE_ML_BLEND_HEURISTIC"),
    )

    #: e.g. redis://redis:6379/0 — empty disables Redis-backed auth helpers (refresh cache, access denylist).
    redis_url: str = Field(default="", validation_alias=AliasChoices("REDIS_URL"))

    #: OpenAI-compatible API for natural why_match / smart_mods (optional).
    openai_api_key: str = Field(default="", validation_alias=AliasChoices("OPENAI_API_KEY"))
    openai_base_url: str = Field(
        default="https://api.openai.com/v1",
        validation_alias=AliasChoices("OPENAI_BASE_URL"),
    )
    openai_model: str = Field(default="gpt-4o-mini", validation_alias=AliasChoices("OPENAI_MODEL"))
    openai_timeout_seconds: float = Field(default=25.0, validation_alias=AliasChoices("OPENAI_TIMEOUT_SECONDS"))
    bitesense_llm_explanations: bool = Field(
        default=True,
        validation_alias=AliasChoices("BITESENSE_LLM_EXPLANATIONS"),
    )


settings = Settings()
