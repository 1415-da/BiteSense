"""OCR for menu images (requires tesseract on the system path)."""

from __future__ import annotations

import shutil
from io import BytesIO

from PIL import Image


def tesseract_available() -> bool:
    return shutil.which("tesseract") is not None


def extract_image_text(data: bytes) -> str:
    import pytesseract

    img = Image.open(BytesIO(data))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    # Sparse text for multi-column menus works better with OSD auto in many cases; 6 = uniform block
    return pytesseract.image_to_string(img, lang="eng", config="--psm 6")
