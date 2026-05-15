"""Extract plain text from PDF bytes (text layer + optional OCR for scanned pages)."""

from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader

from app.menu_extraction.ocr_image import extract_image_text, tesseract_available

# Below this length we try OCR on rendered pages (scanned / image-only PDFs).
_MIN_TEXT_LAYER_CHARS = 80


def extract_pdf_text(data: bytes) -> str:
    """Text from the PDF's embedded text layer only."""
    reader = PdfReader(BytesIO(data))
    chunks: list[str] = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            chunks.append(t)
    return "\n".join(chunks)


def extract_pdf_ocr_text(data: bytes, *, max_pages: int = 12) -> str:
    """Render pages to images and run Tesseract (for menus without a text layer)."""
    import fitz

    doc = fitz.open(stream=data, filetype="pdf")
    parts: list[str] = []
    try:
        for i, page in enumerate(doc):
            if i >= max_pages:
                break
            pix = page.get_pixmap(dpi=200, alpha=False)
            parts.append(extract_image_text(pix.tobytes("png")))
    finally:
        doc.close()
    return "\n".join(parts)


def extract_pdf_text_full(data: bytes) -> str:
    """
    Prefer the PDF text layer; fall back to OCR when the layer is empty or very short.
  """
    layer = extract_pdf_text(data)
    if len(layer.strip()) >= _MIN_TEXT_LAYER_CHARS:
        return layer
    if not tesseract_available():
        return layer
    try:
        ocr = extract_pdf_ocr_text(data)
    except Exception:
        return layer
    if not ocr.strip():
        return layer
    if layer.strip():
        return f"{layer.strip()}\n{ocr.strip()}"
    return ocr.strip()
