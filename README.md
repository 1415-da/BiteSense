# BiteSense

## Run with PostgreSQL in Docker

1. Copy env file:
   - `cp .env.example .env`

2. Start Postgres + API:
   - `docker compose up --build`

3. Verify backend health:
   - `http://localhost:8000/health`

4. **Web UI in Docker** (static build + nginx on host port **3000**):
   - `docker compose up -d --build ui` — open **`http://localhost:3000`** (override with **`UI_HOST_PORT`** in `.env`).
   - API calls use same-origin **`/api`** (nginx proxies to the `api` service), same pattern as Vite dev on **5173**.

5. (Optional) run the Vite dev server on the host (**port 5173**):
   - `npm run dev` — open **`http://localhost:5173`**
   - Leave **`VITE_PUBLIC_API_BASE_URL`** empty in `.env` so `/api` is proxied to **`http://127.0.0.1:8000`**.

6. **Redis** (cache/sessions — optional until the app uses it):
   - `docker compose up -d redis` — **`localhost:6379`** (or **`REDIS_HOST_PORT`**). Data in volume **`redis_data`**.

7. (Optional) open DB UI (Adminer):
   - `http://localhost:8081`
   - System: `PostgreSQL`
   - Server: `db`
   - Username: `${POSTGRES_USER}` (default `postgres`)
   - Password: `${POSTGRES_PASSWORD}` (default `postgres`)
   - Database: `${POSTGRES_DB}` (default `bitesense`)

8. **ML metrics dashboard** (compose includes `ml-flow` — not the MLflow product):
   - Open `http://localhost:9092` for hybrid scorer JSON metrics (uses `ML_METRICS_INTERNAL_SECRET` from `.env`, same as the API). The service calls `http://api:8000` by default and ignores host proxy env inside the container (`trust_env=false` + empty `HTTP_PROXY`).
   - Prometheus text: `http://localhost:9092/raw/prometheus` (and on the API: `http://localhost:8000/api/v1/recommendations/metrics/prometheus` with the same auth as `/metrics`).

9. **MLflow** (real tracking UI — RMSE, MAE, MAPE, R², runs, artifacts):
   - Start or rebuild so the `mlflow` service is running: `docker compose up -d --build mlflow`
   - Open **`http://localhost:5050`** (default host port). On macOS, **avoid port 5000** for MLflow: AirPlay Receiver binds `*:5000` (blank page). **`MLFLOW_HOST_PORT`** defaults to **`5050`** (`5050:5000`). Set `MLFLOW_HOST_PORT` in `.env` if that port is busy.
   - Store/artifacts persist in the `mlflow_data` volume.
   - Log a training run (XGBoost + LightGBM + `VotingRegressor` ensemble; metrics are **out-of-sample** MAE/MAPE/R²/RMSE from `predict` vs held-out `y_test`, never hardcoded). When enough rows exist in Postgres (`recommendation_results` joined with run goals/health), the label is the **persisted hybrid `score`** and features match the ranker inputs. Otherwise the run falls back to synthetic data; check MLflow params `data_source` and `dataset_fallback_reason`.
   - Optional: **`BITESENSE_ML_MIN_DB_ROWS`** (default `15`) — lower only for small dev DBs so training uses real rows sooner.

     ```bash
     docker compose run --rm -e MLFLOW_TRACKING_URI=http://mlflow:5000 api python -m app.ml.train_recommender_mlflow
     ```

   - From your machine without Compose networking: `cd backend && MLFLOW_TRACKING_URI=http://127.0.0.1:5050 PYTHONPATH=. python -m app.ml.train_recommender_mlflow` (requires the same Python deps as the API image: `requirements.txt` + `requirements-ml.txt`).

## Useful commands

- Start in background: `docker compose up -d --build`
- Stop containers: `docker compose down`
- Stop and remove DB volume: `docker compose down -v`
- API logs: `docker compose logs -f api`
- DB logs: `docker compose logs -f db`
- Adminer logs: `docker compose logs -f adminer`
- UI (nginx) logs: `docker compose logs -f ui`
- ML flow UI logs: `docker compose logs -f ml-flow`
- MLflow server logs: `docker compose logs -f mlflow`
- Redis logs: `docker compose logs -f redis`

## Database migrations (Alembic)

Alembic runs `upgrade head` automatically every time the API starts, so the schema stays in sync with the models. To create new migrations after changing `backend/app/models.py`:

```bash
# Inside Docker
docker compose exec api alembic revision --autogenerate -m "describe the change"

# Or locally (requires DATABASE_URL to point at a running Postgres)
cd backend && PYTHONPATH=. alembic revision --autogenerate -m "describe the change"
```

Other useful commands: `alembic current`, `alembic history --verbose`, `alembic downgrade -1`.

## Notes

- **Redis** (when `REDIS_URL` is set, e.g. in Docker): caches revoked refresh hashes and supports immediate access-token invalidation on logout when the client sends `access_token` with `refresh_token`. `/health` reports `redis: ok|disabled|error`.
- Local (outside Docker) DB URL in `.env` uses `localhost`.
- Docker API service overrides `DATABASE_URL` to use host `db` inside the Docker network.
- Postgres is intentionally not published to host to avoid random invalid startup packets and reduce exposure.
- Required backend driver for Postgres: `psycopg[binary]` (already in `backend/requirements.txt`).

## Surrogate + heuristic blend (optional)

After training, export the ensemble and point the API at the file:

1. `BITESENSE_ML_EXPORT_PATH=/app/models/ensemble.joblib` (or host path under `backend/models/`) when running `python -m app.ml.train_recommender_mlflow`.
2. Set `BITESENSE_ML_ENSEMBLE_PATH=/app/models/ensemble.joblib` in `.env` (Compose mounts `./backend/models` read-only).
3. Tune `BITESENSE_ML_BLEND_HEURISTIC` (default `0.55` = 55% heuristic, 45% surrogate).

Ranking uses **`hybrid-v1+surrogate`** when the file loads; persisted run metrics include `surrogate_used`, `mean_heuristic`, `mean_ml`, `mean_final`. Prometheus exposes `bitesense_ml_surrogate_active` and related gauges.

## Hybrid menu recommender (API)

- `POST /api/v1/recommendations/rank` — body `{ "scan_id": <optional>, "top_n": 6 }`. Uses saved goals/health + scan dishes; persists a `recommendation_runs` row and ranked `recommendation_results`.
- `GET /api/v1/recommendations/metrics` — JWT, or header `X-ML-Internal-Secret` when `ML_METRICS_INTERNAL_SECRET` is set (used by `ml-flow`).
- `GET /api/v1/recommendations/metrics/prometheus` — same auth; Prometheus text format.
- `GET /api/v1/recommendations/history` — JWT required; recent runs for the user.

Docker: watch scorer timing lines in API logs:

```bash
docker compose logs -f api | grep METRICS
```

## Backend tests

```bash
cd backend && PYTHONPATH=. python -m pytest tests/ -v
```
