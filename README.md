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

## Useful commands

- Start in background: `docker compose up -d --build`
- Stop containers: `docker compose down`
- Stop and remove DB volume: `docker compose down -v`
- API logs: `docker compose logs -f api`
- DB logs: `docker compose logs -f db`
- Adminer logs: `docker compose logs -f adminer`

## Notes

- Local (outside Docker) DB URL in `.env` uses `localhost`.
- Docker API service overrides `DATABASE_URL` to use host `db` inside the Docker network.
- Postgres is intentionally not published to host to avoid random invalid startup packets and reduce exposure.
- Required backend driver for Postgres: `psycopg[binary]` (already in `backend/requirements.txt`).
