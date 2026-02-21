# suburb-analytics

Minimal scaffold for suburb analytics service (demo).

Quick start:

1. cd suburb-analytics
2. npm install
3. edit `.env` (set `OPENROUTESERVICE_API_KEY` if you want ORS)
4. npm run dev

Endpoints:
- `GET /health` health check
- `GET /api/suburb/metrics/:name?state=NSW` generate metrics for a suburb
- `GET /api/suburbs` list suburbs (if DB/data present)
