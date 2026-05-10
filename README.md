# BiteSense

## Run with PostgreSQL in Docker

1. Copy env file:
   - `cp .env.example .env`

2. Start Postgres + API:
   - `docker compose up --build`

3. Verify backend health:
   - `http://localhost:8000/health`

4. (Optional) run frontend separately:
   - `npm run dev`

5. (Optional) open DB UI (Adminer):
   - `http://localhost:8081`
   - System: `PostgreSQL`
   - Server: `db`
   - Username: `${POSTGRES_USER}` (default `postgres`)
   - Password: `${POSTGRES_PASSWORD}` (default `postgres`)
   - Database: `${POSTGRES_DB}` (default `bitesense`)

6. **ML metrics dashboard** (compose includes `ml-flow` — not the MLflow product):
   - Open `http://localhost:9092` for hybrid scorer JSON metrics (uses `ML_METRICS_INTERNAL_SECRET` from `.env`, same as the API). The service calls `http://api:8000` by default and ignores host proxy env inside the container (`trust_env=false` + empty `HTTP_PROXY`).
   - Prometheus text: `http://localhost:9092/raw/prometheus` (and on the API: `http://localhost:8000/api/v1/recommendations/metrics/prometheus` with the same auth as `/metrics`).

7. **MLflow** (real tracking UI — RMSE, MAE, MAPE, R², runs, artifacts):
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
- ML flow UI logs: `docker compose logs -f ml-flow`
- MLflow server logs: `docker compose logs -f mlflow`

## Notes

- Local (outside Docker) DB URL in `.env` uses `localhost`.
- Docker API service overrides `DATABASE_URL` to use host `db` inside the Docker network.
- Postgres is intentionally not published to host to avoid random invalid startup packets and reduce exposure.
- Required backend driver for Postgres: `psycopg[binary]` (already in `backend/requirements.txt`).

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
