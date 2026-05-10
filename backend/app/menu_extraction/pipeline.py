"""Orchestrate text extraction (bytes, URL) + parsing."""

from __future__ import annotations

import httpx
from bs4 import BeautifulSoup

from app.menu_extraction.ocr_image import extract_image_text, tesseract_available
from app.menu_extraction.parser import ParsedItem, confidence_score, parse_menu_text
from app.menu_extraction.pdf_text import extract_pdf_text


def extract_from_text(raw_text: str) -> tuple[list[dict[str, object]], int, str]:
    items = parse_menu_text(raw_text)
    conf = confidence_score(raw_text, len(items))
    serialized = [_parsed_to_dict(p) for p in items]
    return serialized, conf, raw_text


def extract_from_bytes(
    data: bytes,
    *,
    content_type: str,
    filename: str | None,
) -> tuple[list[dict[str, object]], int, str]:
    ct = (content_type or "").lower()
    name = (filename or "").lower()

    if "pdf" in ct or name.endswith(".pdf"):
        raw_text = extract_pdf_text(data)
        items, conf, _ = extract_from_text(raw_text)
        return items, conf, raw_text

    if not tesseract_available():
        raise RuntimeError(
            "Tesseract OCR is not installed. Install tesseract-ocr (e.g. apt install tesseract-ocr) "
            "or use PDF menus."
        )
    raw_text = extract_image_text(data)
    items, conf, _ = extract_from_text(raw_text)
    return items, conf, raw_text


def extract_from_url(url: str, *, max_bytes: int = 3_000_000) -> tuple[list[dict[str, object]], int, str]:
    from urllib.parse import urlparse

    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.netloc:
        raise ValueError("Only http(s) menu URLs are allowed.")
    host = p.hostname or ""
    if host in {"localhost", "127.0.0.1", "::1"} or host.startswith("192.168."):
        raise ValueError("URL host is not allowed.")

    with httpx.Client(timeout=15.0, follow_redirects=True) as client:
        r = client.get(url, headers={"User-Agent": "BiteSenseMenuBot/1.0"})
        r.raise_for_status()
        if len(r.content) > max_bytes:
            raise ValueError("Page is too large to process.")
        ct = r.headers.get("content-type", "")

        if "pdf" in ct.lower() or url.lower().endswith(".pdf"):
            return extract_from_bytes(r.content, content_type=ct, filename="menu.pdf")

        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        raw_text = soup.get_text(separator="\n")
        items, conf, _ = extract_from_text(raw_text)
        return items, conf, raw_text


def _parsed_to_dict(p: ParsedItem) -> dict[str, object]:
    return {
        "name": p.name,
        "description": p.description,
        "ingredients": list(p.ingredients),
        "details": p.details,
    }
