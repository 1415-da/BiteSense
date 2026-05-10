"""Shared Redis connection (optional — used for auth revoke/denylist when REDIS_URL is set)."""

from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger(__name__)

_client = None


def get_redis():
    """Return a Redis client, or None if disabled or unreachable."""
    global _client
    url = (settings.redis_url or "").strip()
    if not url:
        return None
    if _client is not None:
        try:
            _client.ping()
            return _client
        except Exception:
            _client = None
    try:
        import redis

        r = redis.Redis.from_url(url, decode_responses=True, socket_connect_timeout=2.5)
        r.ping()
        _client = r
        logger.info("Redis connected")
        return r
    except Exception as exc:
        logger.warning("Redis unavailable: %s", exc)
        return None


def reset_redis_client_for_tests() -> None:
    global _client
    if _client is not None:
        try:
            _client.close()
        except Exception:
            pass
    _client = None


def redis_ping_ok() -> bool | None:
    """True if ping OK, False on failure, None if Redis not configured."""
    r = get_redis()
    if r is None and not (settings.redis_url or "").strip():
        return None
    if r is None:
        return False
    try:
        return bool(r.ping())
    except Exception:
        return False
