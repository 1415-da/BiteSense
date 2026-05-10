from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.menu_extraction.pipeline import extract_from_bytes, extract_from_url
from app.models import MenuScan
from app.schemas import (
    MenuDishOut,
    MenuExtractOut,
    MenuExtractUrlIn,
    MenuScanCreate,
    MenuScanDishesPatch,
    MenuScanOut,
    MenuScanSummary,
)

router = APIRouter(prefix="/scans", tags=["scans"])

_MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _dishes_from_db(raw: list | None) -> list[MenuDishOut]:
    out: list[MenuDishOut] = []
    for d in raw or []:
        if isinstance(d, str):
            s = d.strip()
            if s:
                out.append(MenuDishOut(name=s, description=None, ingredients=[], details=None))
        else:
            out.append(MenuDishOut.model_validate(d))
    return out


def _scan_out(row: MenuScan) -> MenuScanOut:
    return MenuScanOut(
        id=row.id,
        input_mode=row.input_mode,
        menu_url=row.menu_url,
        upload_filename=row.upload_filename,
        restaurant_name=row.restaurant_name,
        cuisine_type=row.cuisine_type,
        location=row.location,
        confidence=row.confidence,
        dishes=_dishes_from_db(list(row.dishes or [])),
        scanned_at=row.created_at,
    )


def _location_label(cuisine: str | None, loc: str | None) -> str:
    parts = [p for p in [cuisine or "", loc or ""] if p.strip()]
    return " · ".join(parts) if parts else "—"


@router.get("/latest", response_model=MenuScanOut | None)
def get_latest_scan(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MenuScanOut | None:
    row = (
        db.query(MenuScan)
        .filter(MenuScan.user_id == user.id)
        .order_by(MenuScan.created_at.desc())
        .first()
    )
    if row is None:
        return None
    return _scan_out(row)


@router.get("", response_model=list[MenuScanSummary])
def list_scans(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[MenuScanSummary]:
    rows = (
        db.query(MenuScan)
        .filter(MenuScan.user_id == user.id)
        .order_by(MenuScan.created_at.desc())
        .all()
    )
    out: list[MenuScanSummary] = []
    for r in rows:
        dishes = list(r.dishes or [])
        out.append(
            MenuScanSummary(
                id=r.id,
                restaurant_label=(r.restaurant_name or "").strip() or "Menu scan",
                location_label=_location_label(r.cuisine_type, r.location),
                scanned_at=r.created_at,
                item_count=len(dishes),
                confidence=r.confidence,
            )
        )
    return out


@router.post("", response_model=MenuScanOut, status_code=status.HTTP_201_CREATED)
def create_scan(
    body: MenuScanCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MenuScanOut:
    dish_rows = [m.model_dump() for m in body.dishes]
    row = MenuScan(
        user_id=user.id,
        input_mode=body.input_mode,
        menu_url=body.menu_url.strip() if body.menu_url else None,
        upload_filename=body.upload_filename.strip() if body.upload_filename else None,
        restaurant_name=body.restaurant_name.strip() if body.restaurant_name else None,
        cuisine_type=body.cuisine_type.strip() if body.cuisine_type else None,
        location=body.location.strip() if body.location else None,
        confidence=body.confidence,
        dishes=dish_rows,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _scan_out(row)


@router.patch("/{scan_id}", response_model=MenuScanOut)
def patch_scan_dishes(
    scan_id: int,
    body: MenuScanDishesPatch,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MenuScanOut:
    row = db.query(MenuScan).filter(MenuScan.id == scan_id, MenuScan.user_id == user.id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    row.dishes = [m.model_dump() for m in body.dishes]
    db.commit()
    db.refresh(row)
    return _scan_out(row)


@router.post("/extract", response_model=MenuExtractOut)
async def extract_menu_upload(
    user: CurrentUser,
    file: UploadFile = File(...),
    include_raw: Annotated[bool, Query()] = False,
) -> MenuExtractOut:
    _ = user.id
    data = await file.read()
    if len(data) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large (max 10MB).",
        )
    if len(data) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")
    ct = file.content_type or "application/octet-stream"
    try:
        items_raw, conf, raw_text = extract_from_bytes(data, content_type=ct, filename=file.filename)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not extract menu: {e}",
        ) from e
    items = [MenuDishOut.model_validate(x) for x in items_raw]
    return MenuExtractOut(confidence=conf, items=items, raw_text=raw_text if include_raw else None)


@router.post("/extract-url", response_model=MenuExtractOut)
def extract_menu_url(
    body: MenuExtractUrlIn,
    user: CurrentUser,
    include_raw: Annotated[bool, Query()] = False,
) -> MenuExtractOut:
    _ = user.id
    try:
        items_raw, conf, raw_text = extract_from_url(body.url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not fetch menu: {e}",
        ) from e
    items = [MenuDishOut.model_validate(x) for x in items_raw]
    return MenuExtractOut(confidence=conf, items=items, raw_text=raw_text if include_raw else None)
