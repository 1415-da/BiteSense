from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth_utils import decode_access_token, get_user_by_id
from app.config import settings
from app.database import get_db
from app.models import User

security = HTTPBearer(auto_error=False)


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(creds.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    jti = payload.get("jti")
    if jti:
        from app.redis_auth import is_access_jti_denied
        from app.redis_client import get_redis

        rx = get_redis()
        if rx is not None and is_access_jti_denied(rx, str(jti)):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session ended")
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def verify_ml_metrics_access(
    db: Annotated[Session, Depends(get_db)],
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    x_ml_internal_secret: Annotated[str | None, Header()] = None,
) -> None:
    """JWT (any user) or optional X-ML-Internal-Secret when ML_METRICS_INTERNAL_SECRET is configured on the API."""
    exp = settings.ml_metrics_internal_secret
    if exp and x_ml_internal_secret == exp:
        return None
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Provide Authorization: Bearer <token>, or X-ML-Internal-Secret when enabled for service access.",
        )
    payload = decode_access_token(creds.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    jti = payload.get("jti")
    if jti:
        from app.redis_auth import is_access_jti_denied
        from app.redis_client import get_redis

        rx = get_redis()
        if rx is not None and is_access_jti_denied(rx, str(jti)):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session ended")
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return None


MlMetricsAccess = Annotated[None, Depends(verify_ml_metrics_access)]
