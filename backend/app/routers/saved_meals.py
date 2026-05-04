from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import SavedMeal
from app.schemas import SavedMealCreate, SavedMealOut

router = APIRouter(prefix="/saved-meals", tags=["saved_meals"])


@router.get("", response_model=list[SavedMealOut])
def list_saved(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[SavedMealOut]:
    rows = (
        db.query(SavedMeal)
        .filter(SavedMeal.user_id == user.id)
        .order_by(SavedMeal.created_at.desc())
        .all()
    )
    return [SavedMealOut.model_validate(r) for r in rows]


@router.post("", response_model=SavedMealOut, status_code=status.HTTP_201_CREATED)
def create_saved(
    body: SavedMealCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> SavedMealOut:
    row = SavedMeal(
        user_id=user.id,
        dish_name=body.dish_name.strip(),
        restaurant=body.restaurant.strip(),
        note=body.note.strip(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return SavedMealOut.model_validate(row)


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved(
    meal_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    row = db.query(SavedMeal).filter(SavedMeal.id == meal_id, SavedMeal.user_id == user.id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved meal not found")
    db.delete(row)
    db.commit()
