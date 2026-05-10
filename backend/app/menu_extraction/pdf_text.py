"""Extract plain text from PDF bytes."""

from __future__ import annotations

from pypdf import PdfReader
from io import BytesIO


def extract_pdf_text(data: bytes) -> str:
    reader = PdfReader(BytesIO(data))
    chunks: list[str] = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            chunks.append(t)
    return "\n".join(chunks)
