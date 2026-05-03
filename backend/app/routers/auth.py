import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth_utils import (
    create_access_token,
    find_valid_refresh_row,
    get_user_by_id,
    hash_password,
    revoke_refresh_by_raw,
    rotate_refresh,
    store_refresh_token,
    verify_password,
)
from app.config import settings
from app.database import get_db
from app.deps import CurrentUser
from app.google_verify import verify_google_id_token
from app.models import User
from app.schemas import (
    GoogleSignIn,
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(body: UserCreate, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access, expires_in = create_access_token(user.id, user.email)
    refresh = store_refresh_token(db, user.id)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=expires_in,
    )


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access, expires_in = create_access_token(user.id, user.email)
    refresh = store_refresh_token(db, user.id)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=expires_in,
    )


@router.post("/google", response_model=TokenResponse)
def google_sign_in(body: GoogleSignIn, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    if not settings.google_client_id.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on the server (set VITE_GOOGLE_OAUTH_WEB_CLIENT_ID in the root .env).",
        )
    try:
        info = verify_google_id_token(body.id_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credential")
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e

    sub = info.get("sub")
    email_raw = info.get("email")
    if not sub or not email_raw or not isinstance(email_raw, str):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token missing identity")
    if info.get("email_verified") is False:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Google email is not verified")

    email = email_raw.lower()
    name = info.get("name")
    full_name = (
        name.strip()[:255]
        if isinstance(name, str) and name.strip()
        else email.split("@", 1)[0]
    )

    user = db.query(User).filter(User.google_sub == sub).first()
    if user is None:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            dummy_pw = secrets.token_urlsafe(32)
            user = User(
                email=email,
                password_hash=hash_password(dummy_pw),
                full_name=full_name,
                google_sub=sub,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if user.google_sub is None:
                user.google_sub = sub
                db.commit()
                db.refresh(user)
            elif user.google_sub != sub:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This email is already linked to another account.",
                )

    access, expires_in = create_access_token(user.id, user.email)
    refresh = store_refresh_token(db, user.id)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=expires_in,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(body: RefreshRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    old_row = find_valid_refresh_row(db, body.refresh_token)
    if old_row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    user = get_user_by_id(db, old_row.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    new_refresh = rotate_refresh(db, old_row)
    access, expires_in = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=access,
        refresh_token=new_refresh,
        expires_in=expires_in,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(body: LogoutRequest, db: Annotated[Session, Depends(get_db)]) -> None:
    revoke_refresh_by_raw(db, body.refresh_token)


@router.get("/me", response_model=UserPublic)
def me(user: CurrentUser) -> UserPublic:
    return UserPublic(id=user.id, email=user.email, full_name=user.full_name)
