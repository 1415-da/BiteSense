# BiteSense

**Choose healthier meals before you order.**

BiteSense is a full-stack web app that helps people make better restaurant choices. You upload or link a menu (URL, image, or PDF), the app extracts dishes and ingredients, then ranks meals against your personal goals, allergens, and diet rules. Each recommendation includes match scores, macro estimates, plain-language “why it fits” lines, and practical modification tips.

---

## What this project is about

Eating out is hard when you care about macros, allergies, or specific diets. Menus are unstructured, portions are unclear, and “healthy” options are not obvious. BiteSense turns a menu into structured data and scores every dish for *your* profile—not a generic calorie chart.

**Typical flow:**

1. **Sign up** and set profile, fitness goals (macros, target weight, activity), and health guardrails (allergens, diets, sodium/sugar limits).
2. **Scan a menu** from a restaurant website, photo, or PDF. Text is extracted via URL fetch, OCR (images), or PDF text layer + OCR fallback.
3. **Review parsed dishes** in a compact editor—fix names, ingredients, or add items manually.
4. **Get ranked recommendations** with hybrid scoring (rule-based heuristics + optional ML surrogate), filtered for allergens and diet conflicts.
5. **Save favorites**, browse scan history, and refine goals over time.

The product is built as a portfolio-grade demo: polished React UI, JWT auth, PostgreSQL persistence, Docker Compose for local deployment, and an ML pipeline (MLflow training, optional ensemble blend, optional LLM explanations).

---

## Features

| Area | Capabilities |
|------|----------------|
| **Menu intake** | URL, image (PNG/JPEG/WebP), PDF upload; debug raw-text view for OCR tuning |
| **Parsing** | Dish names, ingredient lines, descriptions; table-style menus (dish + ingredients columns) |
| **Personalization** | Primary goal, macro targets, workouts/week, allergens, diet tags, sodium/sugar ceilings |
| **Recommendations** | Top-N ranked cards, match score (0–100), macro bars, filter by search/min score |
| **Explanations** | Rule-based “why it matches” + “smart modifications”; optional OpenAI-compatible LLM layer |
| **Workspace** | Overview dashboard, scan history, saved meals, account & security |
| **Auth** | Register/login, JWT access + refresh, password change, optional Redis-backed logout revoke |
| **Observability** | Recommendation metrics API, Prometheus export, MLflow training runs |

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, TypeScript, Vite, React Router, Framer Motion, Lucide icons |
| **Backend** | FastAPI, SQLAlchemy, Alembic, Pydantic, JWT (python-jose), httpx |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis (optional; session revoke / token denylist) |
| **ML** | scikit-learn, XGBoost, LightGBM, MLflow; optional OpenAI API for explanations |
| **Menu extraction** | Tesseract OCR, PyMuPDF, custom parsers |
| **Infra** | Docker Compose, nginx (production UI), Adminer (DB UI) |

---

## Architecture (high level)

```text
┌─────────────┐     /api proxy      ┌──────────────┐     ┌────────────┐
│  React UI   │ ──────────────────► │  FastAPI     │ ──► │ PostgreSQL │
│  (Vite/     │                     │  API :8000   │     │            │
│   nginx)    │                     └──────┬───────┘     └────────────┘
└─────────────┘                            │
                                           ├──► Redis (optional)
                                           ├──► Menu extract → parse → dishes
                                           └──► Ranker (heuristic + optional ML + optional LLM)
```

**Ranking pipeline (simplified):** load user goals/health → filter dishes that violate allergen/diet rules → score survivors with heuristic features (macro fit, guardrails) → blend with optional trained ensemble → attach rule-based (and optional LLM) explanations → persist `recommendation_runs` / `recommendation_results`.

---

## Project structure

```text
BiteSense/
├── src/                    # React frontend (landing + /dashboard)
├── backend/
│   ├── app/
│   │   ├── routers/        # auth, me, scans, recommendations, saved_meals
│   │   ├── ml/             # ranker, features, training, LLM explanations
│   │   └── menu_extraction/
│   ├── alembic/            # DB migrations
│   └── tests/
├── docker-compose.yml      # db, api, ui, redis, mlflow, ml-flow, adminer
├── .env.example            # Shared env for frontend + backend
└── README.md
```

---

## Quick start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (recommended), or Node.js 22+ and Python 3.11+ for local dev
- For PDF OCR in Docker: API image includes Tesseract

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` as needed—at minimum set a strong `JWT_SECRET_KEY` for anything beyond local dev. See `.env.example` for all options (CORS, Redis, ML paths, OpenAI keys).

### 2. Run with Docker (recommended)

```bash
docker compose up -d --build
```

| Service | URL | Purpose |
|---------|-----|---------|
| **API** | http://localhost:8000 | FastAPI (`/health`, `/api/v1/...`) |
| **UI (Docker)** | http://localhost:3000 | Production build + nginx (`/api` proxied) |
| **Adminer** | http://localhost:8081 | DB UI (server: `db`, user/pass from `.env`) |
| **MLflow** | http://localhost:5050 | Experiment tracking (default host port) |
| **ML metrics UI** | http://localhost:9092 | Hybrid scorer JSON/Prometheus viewer |

**Frontend dev (hot reload)** — API and DB still in Docker:

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. Leave `VITE_PUBLIC_API_BASE_URL` empty so Vite proxies `/api` → `http://127.0.0.1:8000`.

> **Note:** After UI code changes, rebuild the Docker UI: `docker compose up -d --build ui`. Vite on port 5173 always serves the latest source.

### 3. Verify

- API health: http://localhost:8000/health  
- Register on the landing page, then open **Dashboard** → **Scan Menu**

---

## Development

### Frontend

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle → dist/
npm run lint
```

### Backend (without Docker)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-ml.txt

# From repo root — DATABASE_URL in .env must reach Postgres
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Alembic runs `upgrade head` on API startup. To create a migration after model changes:

```bash
docker compose exec api alembic revision --autogenerate -m "describe the change"
# or locally:
cd backend && PYTHONPATH=. alembic revision --autogenerate -m "describe the change"
```

### Tests

```bash
cd backend && PYTHONPATH=. python -m pytest tests/ -v
```

---

## Main API endpoints

All workspace routes require `Authorization: Bearer <access_token>` unless noted.

| Group | Examples |
|-------|----------|
| **Auth** | `POST /api/v1/auth/register`, `login`, `refresh`, `logout`, `GET /me` |
| **Profile** | `GET/PATCH /api/v1/me/profile`, `PUT /api/v1/me/goals`, `PUT /api/v1/me/health` |
| **Scans** | `POST /api/v1/scans/extract`, `extract-url`, `POST /api/v1/scans`, `GET /api/v1/scans/latest` |
| **Recommendations** | `POST /api/v1/recommendations/rank`, `GET /history`, `GET /metrics` |
| **Saved meals** | `GET/POST /api/v1/saved-meals`, `DELETE /api/v1/saved-meals/{id}` |

Interactive docs (when API is running): http://localhost:8000/docs

---

## ML & recommendations

- **Hybrid ranker** combines heuristic scoring with an optional exported ensemble (`BITESENSE_ML_ENSEMBLE_PATH`, blend weight `BITESENSE_ML_BLEND_HEURISTIC`).
- **Training** logs to MLflow (MAE, MAPE, R², RMSE on held-out data):

  ```bash
  docker compose run --rm -e MLFLOW_TRACKING_URI=http://mlflow:5000 api \
    python -m app.ml.train_recommender_mlflow
  ```

- **LLM explanations** (optional): set `OPENAI_API_KEY` and `BITESENSE_LLM_EXPLANATIONS=true` in `.env`. Without a key, rule-based explanations still work.

- **Metrics:** `GET /api/v1/recommendations/metrics` (JWT or `X-ML-Internal-Secret`), Prometheus at `/metrics/prometheus`.

Watch scorer timing in logs:

```bash
docker compose logs -f api | grep METRICS
```

---

## Environment variables (summary)

| Variable | Purpose |
|----------|---------|
| `VITE_PUBLIC_API_BASE_URL` | Frontend API base; empty = same-origin `/api` proxy |
| `DATABASE_URL` | SQLAlchemy URL (Compose overrides host to `db`) |
| `JWT_SECRET_KEY` | Sign access/refresh tokens |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origins |
| `REDIS_URL` | Optional revoke cache |
| `BITESENSE_ML_ENSEMBLE_PATH` | joblib ensemble for blended ranking |
| `OPENAI_API_KEY` | Optional LLM explanations |

Full list and comments: [`.env.example`](.env.example).

---

## Useful Docker commands

```bash
docker compose up -d --build          # start stack
docker compose down                   # stop
docker compose down -v                # stop + delete DB volume
docker compose logs -f api            # API logs
docker compose logs -f ui             # nginx UI logs
docker compose exec api alembic current
```

---

## Notes

- Postgres is not published to the host by default (API connects via Docker network `db`).
- On macOS, MLflow UI defaults to port **5050** (port 5000 is often used by AirPlay).
- Redis improves logout semantics when `REDIS_URL` is set; auth works without it.
- Menu PDFs that are scanned images need Tesseract in the API container (`docker compose up --build api`).

---

## License

This repository is provided for educational and portfolio use. Check with the maintainer before production deployment.
