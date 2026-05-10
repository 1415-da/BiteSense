"""
Dedicated ML observability app (separate container).

Proxies hybrid scorer metrics from the main API using X-ML-Internal-Secret so Docker
services can expose dashboards without user JWTs.

Run: uvicorn app.ml_flow_app:app --host 0.0.0.0 --port 9092
"""

from __future__ import annotations

import html
import os
from typing import Any
from urllib.parse import urlparse, urlunsplit

import httpx
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse

# Inside Compose this must be the `api` service (not localhost). Do not read API_INTERNAL_URL — host/shell
# env often sets it to invalid values; use ML_FLOW_API_BASE only for rare overrides.
_DEFAULT_API = "http://api:8000"
INTERNAL_SECRET = (os.environ.get("ML_METRICS_INTERNAL_SECRET") or "").strip()

app = FastAPI(title="BiteSense ML flow / metrics view", version="0.1.0")


def _http_client() -> httpx.AsyncClient:
    # trust_env=False: ignore HTTP_PROXY/HTTPS_PROXY — malformed proxy URLs cause InvalidURL (IPv6-looking "ports").
    return httpx.AsyncClient(trust_env=False, timeout=15.0)


def resolve_api_base() -> str:
    """API base; default Compose service `http://api:8000`. Optional override: env ML_FLOW_API_BASE only."""
    raw = (os.environ.get("ML_FLOW_API_BASE") or "").strip().strip('"').strip("'").lstrip("\ufeff")
    if not raw:
        return _DEFAULT_API
    if not raw.startswith(("http://", "https://")):
        raw = "http://" + raw.lstrip("/")
    try:
        httpx.URL(raw)
    except httpx.InvalidURL:
        return _DEFAULT_API
    p = urlparse(raw)
    if p.scheme not in ("http", "https") or not p.netloc:
        return _DEFAULT_API
    return urlunsplit((p.scheme, p.netloc, "", "", "")).rstrip("/")


def metrics_urls() -> tuple[str, str]:
    base = resolve_api_base()
    return (
        f"{base}/api/v1/recommendations/metrics",
        f"{base}/api/v1/recommendations/metrics/prometheus",
    )


def _headers() -> dict[str, str]:
    if INTERNAL_SECRET:
        return {"X-ML-Internal-Secret": INTERNAL_SECRET}
    return {}


async def _fetch_json(client: httpx.AsyncClient) -> tuple[int, Any]:
    metrics_json, _ = metrics_urls()
    r = await client.get(metrics_json, headers=_headers())
    try:
        body = r.json() if r.content else {}
    except Exception:
        body = {"error": "non-json response", "text": r.text[:500]}
    return r.status_code, body


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ml-flow"}


@app.get("/raw/json")
async def raw_json():
    metrics_json, _ = metrics_urls()
    async with _http_client() as client:
        r = await client.get(metrics_json, headers=_headers())
    try:
        return JSONResponse(content=r.json(), status_code=r.status_code)
    except Exception:
        return JSONResponse(content={"error": r.text[:500]}, status_code=r.status_code)


@app.get("/raw/prometheus", response_class=PlainTextResponse)
async def raw_prometheus():
    _, metrics_prom = metrics_urls()
    async with _http_client() as client:
        r = await client.get(metrics_prom, headers=_headers())
    return PlainTextResponse(content=r.text, status_code=r.status_code)


@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """Simple HTML table + links; use /raw/prometheus for scrapers."""
    if not INTERNAL_SECRET:
        body = (
            "<p><strong>ML_METRICS_INTERNAL_SECRET</strong> is not set on this container. "
            "Set the same secret on the <code>api</code> and <code>ml-flow</code> services.</p>"
        )
        return HTMLResponse(
            f"<!DOCTYPE html><html><head><meta charset='utf-8'><title>BiteSense ML flow</title></head>"
            f"<body style='font-family:system-ui;padding:1.5rem;background:#111827;color:#e5e7eb'>{body}</body></html>"
        )

    try:
        async with _http_client() as client:
            code, data = await _fetch_json(client)
    except httpx.InvalidURL as e:
        return HTMLResponse(
            f"<!DOCTYPE html><html><body style='font-family:system-ui;padding:1.5rem'>"
            f"<p>Invalid URL (metrics endpoint or proxy env). Default base is <code>http://api:8000</code>. "
            f"Override only with <code>ML_FLOW_API_BASE</code> (not <code>API_INTERNAL_URL</code>). "
            f"Ensure <code>HTTP_PROXY</code> / <code>HTTPS_PROXY</code> are unset or valid.</p>"
            f"<pre>{html.escape(str(e))}</pre></body></html>",
            status_code=500,
        )

    if code != 200:
        err = html.escape(str(data))
        return HTMLResponse(
            f"<!DOCTYPE html><html><head><meta charset='utf-8'><title>ML metrics error</title></head>"
            f"<body style='font-family:system-ui;padding:1.5rem;background:#111827;color:#fecaca'>"
            f"<p>API returned {code}</p><pre>{err}</pre>"
            f"</body></html>",
            status_code=502,
        )

    rows_html = []
    if isinstance(data, dict):
        for k in sorted(data.keys()):
            v = data[k]
            rows_html.append(
                "<tr><td style='padding:0.35rem 0.75rem;border-bottom:1px solid #374151'>"
                f"<code>{html.escape(str(k))}</code></td>"
                f"<td style='padding:0.35rem;border-bottom:1px solid #374151'>{html.escape(str(v))}</td></tr>"
            )
    table = (
        "<table style='border-collapse:collapse;min-width:320px;background:#1f2937;border-radius:0.5rem'>"
        + "".join(rows_html)
        + "</table>"
    )

    page = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>BiteSense ML metrics</title></head>
<body style="font-family:system-ui,sans-serif;padding:1.5rem;background:#111827;color:#e5e7eb;max-width:56rem">
  <h1 style="font-size:1.25rem;margin-top:0">Hybrid recommender metrics</h1>
  <p style="color:#9ca3af;font-size:0.9rem">
    Source: <code>{html.escape(resolve_api_base())}</code> · same in-memory stats as the API process.
  </p>
  {table}
  <p style="margin-top:1.25rem;font-size:0.88rem">
    <a href="/raw/prometheus" style="color:#34d399">Prometheus text</a>
    · <a href="/raw/json" style="color:#34d399">JSON</a>
    · API log line: <code style="color:#93c5fd">docker compose logs -f api | grep METRICS</code>
  </p>
</body>
</html>"""
    return HTMLResponse(page)

