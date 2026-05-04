from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth_utils import hash_password, verify_password
from app.database import get_db
from app.deps import CurrentUser
from app.models import User, UserGoals, UserHealth
from app.schemas import (
    GoalsIn,
    GoalsOut,
    HealthIn,
    HealthOut,
    PasswordChange,
    ProfilePatch,
    UserPublic,
)

# Persisted goals + health are the API contract for future menu-scoring / ML features.
router = APIRouter(prefix="/me", tags=["me"])

_DEFAULT_GOALS = GoalsOut(
    primary_goal="Weight loss",
    target_weight_kg="72",
    workouts_per_week=4,
    protein_g=120,
    carbs_g=180,
    fat_g=55,
)

_DEFAULT_HEALTH = HealthOut(
    allergens=["Shellfish"],
    diets=["Pescatarian"],
    max_sodium_mg=2000,
    max_sugar_g=40,
)


@router.get("/profile", response_model=UserPublic)
def get_profile(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)


@router.patch("/profile", response_model=UserPublic)
def patch_profile(
    body: ProfilePatch,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserPublic:
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.email is not None:
        email = str(body.email).lower()
        if email != user.email:
            taken = db.query(User).filter(User.email == email, User.id != user.id).first()
            if taken:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
            user.email = email
    db.commit()
    db.refresh(user)
    return UserPublic.model_validate(user)


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: PasswordChange,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.password_hash = hash_password(body.new_password)
    db.commit()


@router.get("/goals", response_model=GoalsOut)
def get_goals(user: CurrentUser, db: Annotated[Session, Depends(get_db)]) -> GoalsOut:
    row = db.query(UserGoals).filter(UserGoals.user_id == user.id).first()
    if row is None:
        return _DEFAULT_GOALS
    return GoalsOut(
        primary_goal=row.primary_goal,
        target_weight_kg=row.target_weight_kg,
        workouts_per_week=row.workouts_per_week,
        protein_g=row.protein_g,
        carbs_g=row.carbs_g,
        fat_g=row.fat_g,
    )


@router.put("/goals", response_model=GoalsOut)
def put_goals(
    body: GoalsIn,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> GoalsOut:
    row = db.query(UserGoals).filter(UserGoals.user_id == user.id).first()
    if row is None:
        row = UserGoals(user_id=user.id)
        db.add(row)
    row.primary_goal = body.primary_goal
    row.target_weight_kg = body.target_weight_kg
    row.workouts_per_week = body.workouts_per_week
    row.protein_g = body.protein_g
    row.carbs_g = body.carbs_g
    row.fat_g = body.fat_g
    db.commit()
    db.refresh(row)
    return GoalsOut(
        primary_goal=row.primary_goal,
        target_weight_kg=row.target_weight_kg,
        workouts_per_week=row.workouts_per_week,
        protein_g=row.protein_g,
        carbs_g=row.carbs_g,
        fat_g=row.fat_g,
    )


@router.get("/health", response_model=HealthOut)
def get_health(user: CurrentUser, db: Annotated[Session, Depends(get_db)]) -> HealthOut:
    row = db.query(UserHealth).filter(UserHealth.user_id == user.id).first()
    if row is None:
        return _DEFAULT_HEALTH
    return HealthOut(
        allergens=list(row.allergens or []),
        diets=list(row.diets or []),
        max_sodium_mg=row.max_sodium_mg,
        max_sugar_g=row.max_sugar_g,
    )


@router.put("/health", response_model=HealthOut)
def put_health(
    body: HealthIn,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> HealthOut:
    row = db.query(UserHealth).filter(UserHealth.user_id == user.id).first()
    if row is None:
        row = UserHealth(user_id=user.id)
        db.add(row)
    row.allergens = list(body.allergens)
    row.diets = list(body.diets)
    row.max_sodium_mg = body.max_sodium_mg
    row.max_sugar_g = body.max_sugar_g
    db.commit()
    db.refresh(row)
    return HealthOut(
        allergens=list(row.allergens or []),
        diets=list(row.diets or []),
        max_sodium_mg=row.max_sodium_mg,
        max_sugar_g=row.max_sugar_g,
    )
