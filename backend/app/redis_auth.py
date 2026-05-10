"""Auth-related Redis keys: refresh revoke cache + access JWT jti denylist."""

from __future__ import annotations

P = "bitesense:"


def mark_refresh_revoked(client, token_hash: str, ttl_seconds: int) -> None:
    if ttl_seconds < 1:
        ttl_seconds = 60
    client.setex(f"{P}refresh_revoked:{token_hash}", ttl_seconds, "1")


def is_refresh_revoked_cached(client, token_hash: str) -> bool:
    return bool(client.exists(f"{P}refresh_revoked:{token_hash}"))


def denylist_access_jti(client, jti: str, ttl_seconds: int) -> None:
    if ttl_seconds < 1:
        ttl_seconds = 60
    client.setex(f"{P}access_deny:{jti}", ttl_seconds, "1")


def is_access_jti_denied(client, jti: str) -> bool:
    return bool(client.exists(f"{P}access_deny:{jti}"))
