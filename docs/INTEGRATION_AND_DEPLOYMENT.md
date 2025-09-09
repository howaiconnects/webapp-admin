# Integration and Deployment — HowAIConnects (concise guide)

This file gives a practical, repo-specific checklist and config examples for:
- Adapting the WowDash admin dashboard into the monorepo Next.js app
- Self-hosting Latitude on an Azure VM behind Traefik with TLS
- Recommended `.env.example` and `docker-compose.yml` patterns for local/dev

Important repo references
- WowDash template read-only reference: [`templates/wowdash-admin-dashboard-readonly`](templates/wowdash-admin-dashboard-readonly:1)
- Working copy location (suggested): [`webapp-admin`](webapp-admin:1)
- CI snapshot workflow: [`.github/workflows/prompt-history.yml`](.github/workflows/prompt-history.yml:1)

1) WowDash -> Next.js monorepo integration (high level)
- Preferred layout: keep app in a workspace (pnpm) as [`apps/webapp-admin`](apps/webapp-admin:1) or [`frontend/webapp-admin`](frontend/webapp-admin:1).
- Steps:
  1. Create the app folder and copy only necessary assets from [`templates/wowdash-admin-dashboard-readonly`](templates/wowdash-admin-dashboard-readonly:1) (components, styles, images). Do not edit the templates folder.
  2. Replace server-side templating with React pages/components:
     - Map static HTML pages to Next.js app routes under [`apps/webapp-admin/app`](apps/webapp-admin/app:1).
     - Convert layout and partials into React components under [`apps/webapp-admin/components`](apps/webapp-admin/components:1).
  3. Move global styles into CSS modules or Tailwind config depending on repo standard; prefer scoped CSS modules to reduce risk of global collisions.
  4. Wire authentication routes to the monorepo auth provider (Supabase / NextAuth) via environment variables in [`apps/webapp-admin/.env.local`](apps/webapp-admin/.env.local:1).
  5. Add entry in the monorepo package.json workspaces and update Turborepo config to include the new app.

2) Latitude self-host (Azure VM) with Traefik reverse proxy (summary)
- Goal: run Latitude in Docker Compose on an Ubuntu Azure VM, fronted by Traefik handling TLS (Let’s Encrypt) and routes.
- Key components:
  - latitude-llm service (official latitude server image or built image)
  - postgres (managed or local container)
  - redis (for queue/worker use)
  - traefik (reverse proxy, ACME for TLS)
  - optional: admin / dashboard ports behind Traefik routes

- Minimal `docker-compose.yml` sketch (place in [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1)):
  - Services: traefik, latitude, postgres, redis
  - Networks: web, internal
  - Volumes: traefik/acme, postgres/data, latitude/data

- Traefik notes:
  - Use labels to route: label traefik.http.routers.latitude.rule=Host(`latitude.example.com`)
  - Use LetsEncrypt via ACME: configure `certresolver: myresolver` and mount `/acme.json` (protected)
  - Redirect HTTP -> HTTPS and enable HSTS as needed

- System & Azure considerations:
  - Ensure ports 80 and 443 are open in Azure NSG.
  - Use a DNS A record pointing `latitude.example.com` to the VM public IP.
  - Use a non-root user for running docker-compose and secure volumes with proper permissions.

3) Example `.env.example` (root-level)
Create a minimal `.env.example` at repo root with these keys (do not store real secrets):
- CORE app / Next.js
  - NEXT_PUBLIC_API_URL=https://api.example.com
  - NEXTAUTH_URL=https://app.example.com
- Latitude
  - LATITUDE_HOST=https://latitude.example.com
  - LATITUDE_DATABASE_URL=postgres://username:password@postgres:5432/latitude
  - LATITUDE_REDIS_URL=redis://redis:6379
  - LATITUDE_SECRET=change_me_to_a_strong_secret
- Databases / Services
  - DATABASE_URL=postgres://user:pass@db:5432/howaiconnects
  - REDIS_URL=redis://redis:6379
  - AIRTABLE_API_KEY=keyxxxx
  - MIRO_CLIENT_ID=miro_xxx
  - MIRO_CLIENT_SECRET=miro_secret
  - QDRANT_URL=http://qdrant:6333
- CI/Automation
  - GITHUB_TOKEN=ghp_xxx   # do not commit real token

4) Recommended `docker-compose.yml` snippet (latitude-llm/docker-compose.yml)
- Include in repo for local/dev testing. Example responsibilities:
  - traefik service with mounted `/var/run/docker.sock` and label-based routing
  - latitude service built from Dockerfile or official image; expose internal port only; rely on traefik to expose externally
  - postgres + redis with persistent volumes
- Keep production secrets in env or Docker secrets; do not commit them.

5) Deploy steps (concise)
- Provision Azure VM (Ubuntu 22.04 recommended), open 80 and 443.
- Install Docker and Docker Compose v2.
- Clone repo and copy `latitude-llm/.env.local` from `.env.example` and fill secrets.
- Run: docker compose -f latitude-llm/docker-compose.yml up -d
- Check Traefik dashboard (if enabled) to verify certificates issued.

6) Security & production notes
- Use Docker secrets or Azure Key Vault for production secrets.
- Prefer managed Postgres for production (Azure Database for PostgreSQL) and connect Latitude via secure connection strings.
- Use firewall rules and disable unused ports.
- Rotate LATITUDE_SECRET and PATs periodically; store PATs as GitHub Secrets for workflows.

7) CI & workflows
- The repo includes prompt-history scheduler: [`.github/workflows/prompt-history.yml`](.github/workflows/prompt-history.yml:1)
- For release workflow create `.github/workflows/release.yml` that:
  - Builds Docker images
  - Tags and pushes images to your container registry
  - Optionally deploys to VM (via SSH or GitHub Deployment actions) or triggers a separate deployment pipeline.

8) Integration checklist (actionable)
- [ ] Create [`apps/webapp-admin`](apps/webapp-admin:1) and import selected WowDash assets
- [ ] Add app to pnpm workspaces and Turborepo config
- [ ] Create `latitude-llm/.env.local` from `.env.example`
- [ ] Provision Azure VM and DNS record
- [ ] Deploy docker stack with Traefik on the VM
- [ ] Verify TLS certificate issuance and Latitude health endpoints
- [ ] Add secrets to GitHub repo (REPO_PUSH_PAT, DOCKER_REGISTRY_TOKEN)

9) Useful file references in this repo
- Prompt snapshot workflow: [`.github/workflows/prompt-history.yml`](.github/workflows/prompt-history.yml:1)
- CI baseline: [`.github/workflows/ci.yml`](.github/workflows/ci.yml:1)
- Branch enforcement: [`scripts/branch-helper.ts`](scripts/branch-helper.ts:1)
- Token push helper: [`scripts/ci-git-config.sh`](scripts/ci-git-config.sh:1)

If you want, I will:
- Create `latitude-llm/docker-compose.yml` example and a secure `traefik/` label template.
- Add a root-level `.env.example`.
- Add a step-by-step `DEPLOY_LATITUDE.md` with exact Traefik labels and ACME config.

Tell me which of these three artifacts you want me to create now and I will write them into the repo:
- Create [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1) example
- Create root-level [`.env.example`](.env.example:1)
- Create `DEPLOY_LATITUDE.md` with full Traefik + ACME templates


## Quickstart

A concise path to get a developer running locally using pnpm, and where the new quickstart artifacts live.

Files added for quickstart & env scaffolding
- [`QUICKSTART.md`](../QUICKSTART.md:1) — a short root-level quickstart (5 steps) for developers.
- [`.env.example`](../.env.example:1) — root-level environment template with primary keys and inline comments.
- `apps/webapp-admin/.env.local.example` — per-app example env for the webapp-admin app.
- `apps/prompt-lab/.env.local.example` — per-app example env for prompt-lab.

Minimal local sequence (copy / paste)
1. Install dependencies at repo root:
   - pnpm install
2. Copy root env and app-level examples:
   - cp .env.example .env.root.local
   - cp apps/webapp-admin/.env.local.example apps/webapp-admin/.env.local
   - cp apps/prompt-lab/.env.local.example apps/prompt-lab/.env.local
3. (Optional) Install individual app deps:
   - pnpm --filter apps/webapp-admin install
4. Run placeholder monorepo dev command:
   - pnpm run dev:all   # placeholder until implemented
5. Run WowDash working copy (standalone):
   - cd wowdash-admin-dashboard/wow-dash-frontend/WowDash && npm install && npm start

Notes
- CI loads `.env.root.local` when present (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml:1)).
- Do not commit `.env*.local` files — they are intentionally excluded and blocked by pre-commit hooks.
- The `dev:all` script is a placeholder and will be implemented in follow-up work.

Quick checklist — remaining bootstrapping tasks (upcoming)
- [ ] Prisma migrations & seeds (prisma/migrations + seed script)
- [ ] docker-compose.dev.yml for local services (postgres, redis, qdrant, traefik)
- [ ] Implement `pnpm run dev:all` orchestration
- [ ] Add per-app README dev instructions and dev scripts (apps/webapp-admin)
