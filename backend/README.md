# Bite Sense API

FastAPI service for authentication and future menu APIs. Configuration is read from **`.env` in the repository root** (same file as the Vite frontend).

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

From the repo root, copy `.env.example` to `.env` and adjust values.

## Run

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health: `GET http://127.0.0.1:8000/health`
- Register: `POST /api/v1/auth/register` with JSON `{ "email", "password", "full_name" }`
- Login: `POST /api/v1/auth/login` with `{ "email", "password" }`
- Refresh: `POST /api/v1/auth/refresh` with `{ "refresh_token" }`
- Logout: `POST /api/v1/auth/logout` with `{ "refresh_token" }`
- Current user: `GET /api/v1/auth/me` with `Authorization: Bearer <access_token>`

Workspace (all require `Authorization: Bearer <access_token>`):

- `GET/PATCH /api/v1/me/profile`, `POST /api/v1/me/password`, `GET/PUT /api/v1/me/goals`, `GET/PUT /api/v1/me/health`
- `GET /api/v1/scans/latest`, `GET /api/v1/scans`, `POST /api/v1/scans`, `PATCH /api/v1/scans/{id}` (dishes body)
- `GET/POST /api/v1/saved-meals`, `DELETE /api/v1/saved-meals/{id}`

SQLite database file `bitesense.db` is created under `backend/` when you use the default `DATABASE_URL`. Set `JWT_SECRET_KEY` in production.

## Database migrations (Alembic)

Alembic is wired into the FastAPI startup — every time the API starts it runs `alembic upgrade head`, so the schema is always up to date.

### Common commands (run from `backend/`)

```bash
# Create a new migration after changing models.py
alembic revision --autogenerate -m "describe the change"

# Apply all pending migrations
alembic upgrade head

# Show current revision
alembic current

# Show migration history
alembic history --verbose

# Downgrade by one revision
alembic downgrade -1
```

Inside Docker Compose the same commands work via `docker compose exec`:

```bash
docker compose exec api alembic revision --autogenerate -m "describe the change"
docker compose exec api alembic current
```

## PostgreSQL

Set `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname` in the root `.env` and install a driver (e.g. `psycopg[binary]`).
