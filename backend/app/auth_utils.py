from __future__ import annotations

import datetime as dt
import hashlib
import secrets
from typing import Any

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models import RefreshToken, User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int, email: str) -> tuple[str, int]:
    expire = dt.datetime.now(dt.UTC) + dt.timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
        "type": "access",
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    expires_in = int(settings.access_token_expire_minutes * 60)
    return token, expires_in


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def _utc(dt_val: dt.datetime) -> dt.datetime:
    if dt_val.tzinfo is None:
        return dt_val.replace(tzinfo=dt.UTC)
    return dt_val


def store_refresh_token(db: Session, user_id: int) -> str:
    raw = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = dt.datetime.now(dt.UTC) + dt.timedelta(days=settings.refresh_token_expire_days)
    row = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    db.add(row)
    db.commit()
    return raw


def find_valid_refresh_row(db: Session, raw: str) -> RefreshToken | None:
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    row = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash, RefreshToken.revoked_at.is_(None))
        .first()
    )
    if row is None:
        return None
    now = dt.datetime.now(dt.UTC)
    if _utc(row.expires_at) < now:
        return None
    return row


def rotate_refresh(db: Session, old_row: RefreshToken) -> str:
    old_row.revoked_at = dt.datetime.now(dt.UTC)
    db.flush()
    raw = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = dt.datetime.now(dt.UTC) + dt.timedelta(days=settings.refresh_token_expire_days)
    db.add(RefreshToken(user_id=old_row.user_id, token_hash=token_hash, expires_at=expires_at))
    db.commit()
    return raw


def revoke_refresh_by_raw(db: Session, raw: str) -> bool:
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if row is None or row.revoked_at is not None:
        return False
    row.revoked_at = dt.datetime.now(dt.UTC)
    db.commit()
    return True


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()
