# Developer Infrastructure Orchestration

This document explains how to use the new Docker Compose development infrastructure and orchestration scripts added to the monorepo.

## Services

- **Postgres**: Official Postgres 15 image, running on port 5432
- **Redis**: Official Redis 7 image, running on port 6379
- **Qdrant** (optional): Vector database on port 6333 (service is commented out by default)
- **Latitude-LLM** (optional placeholder): Service placeholder for Latitude LLM server (commented out)

## Usage

### Start infrastructure services only

```bash
pnpm run dev:infra
```

This command runs the containers for Postgres, Redis, and optionally Qdrant and Latitude-LLM (if enabled) in detached mode.

### Start application development servers only

```bash
pnpm run dev:apps
```

This command starts the app dev servers in parallel using pnpm workspace filters.  
*Note:* This is a placeholder command; update the filters as needed for your apps.

### Start infrastructure and applications together

```bash
pnpm run dev:all
```

This runs `dev:infra` first (detached, returns quickly), then starts the app dev servers.

## Stop all services and clean volumes

```bash
docker-compose -f docker-compose.dev.yml down -v
```

This stops all containers and removes volumes created by the dev compose.

## Environment Variables

Ensure the following environment variables are set, typically by copying and customizing `.env.example`:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` for Postgres
- `DATABASE_URL` for apps connecting to Postgres (e.g., `postgres://user:password@localhost:5432/howaiconnects`)
- `REDIS_URL` for Redis (e.g., `redis://localhost:6379`)
- `QDRANT_URL` if using vector DB (e.g., `http://localhost:6333`)
- Latitude LLM specific environment variables (if used):
  - `LATITUDE_DATABASE_URL`
  - `LATITUDE_REDIS_URL`
  - `LATITUDE_SECRET`

Refer to `.env.example` for full details and example values.

## Notes

- The latitude-llm service is a placeholder and must be updated with the correct image and configuration before use.
- Qdrant service is commented out by default; uncomment if vector DB is needed.
- Volumes are named with `_dev` suffix to avoid conflicts with production or other compose files.
## Local reverse-proxy and host-based routing

This repo includes a small local reverse-proxy to route traffic by Host header during development:

- Script: [`scripts/local-proxy.mjs`](scripts/local-proxy.mjs:1)
- Orchestrator: [`scripts/dev-all.mjs`](scripts/dev-all.mjs:1) — starts marketing, admin, and the proxy together.

Recommended workflow to run everything locally:

1. Add hosts entry (requires admin privileges)
   - macOS / Linux: edit `/etc/hosts`
   - Windows: edit `C:\Windows\System32\drivers\etc\hosts`
   - Add the line:
     127.0.0.1 app.localhost.com

2. Start infra (optional)
   - pnpm run dev:infra

3. Start apps + proxy (single command)
   - pnpm run dev:all
   - Or run the orchestrator directly with environment overrides:
     MARKETING_CMD="pnpm --filter @howaiconnects/webapp-admin dev --port 3000" ADMIN_CMD="pnpm --filter @howaiconnects/unified-webapp dev --port 3001" node scripts/dev-all.mjs

4. Access via host-based routing
   - Admin (via proxy): http://app.localhost.com (proxied to admin upstream)
   - Marketing / other hosts: http://localhost:3000 (marketing upstream) or use other hostnames mapped to 127.0.0.1

Environment variables accepted by the proxy/orchestrator:
- PROXY_PORT (default 3000)
- MARKETING_UPSTREAM (default http://localhost:3000)
- ADMIN_UPSTREAM (default http://localhost:3001)
- APP_HOSTNAME (default app.localhost.com)

Troubleshooting:
- If you see "Bad Gateway (local proxy error)", confirm upstream dev servers are running and reachable on the expected ports.
- CORS: When accessing different hostnames, ensure your dev servers accept the Host/origin headers used (for Next.js, this is typically fine in dev).
- Ports in use: change upstream ports via env overrides if 3000/3001 are already used.
- Logs: check terminal output — `dev-all` prefixes logs with the process name for easier debugging.