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
- Google (ID token): `POST /api/v1/auth/google` with `{ "id_token": "<credential>" }` — requires `VITE_GOOGLE_OAUTH_WEB_CLIENT_ID` in root `.env`

SQLite database file `bitesense.db` is created under `backend/` when you use the default `DATABASE_URL`. Set `JWT_SECRET_KEY` in production.

## PostgreSQL

Set `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname` in the root `.env` and install a driver (e.g. `psycopg[binary]`).
