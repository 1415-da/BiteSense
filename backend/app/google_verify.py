from __future__ import annotations

from typing import Any

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import settings


def verify_google_id_token(raw_token: str) -> dict[str, Any]:
    if not settings.google_client_id:
        raise RuntimeError("VITE_GOOGLE_OAUTH_WEB_CLIENT_ID is not set in the root .env")
    return id_token.verify_oauth2_token(
        raw_token,
        google_requests.Request(),
        settings.google_client_id,
    )
