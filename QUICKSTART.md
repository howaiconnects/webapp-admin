# Quickstart — HowAIConnects (Monorepo)

This quickstart gives a concise 5-step path to get a developer running locally using pnpm.

Prerequisites
- pnpm >= 7 (recommended pnpm v8 used in CI)
- Node.js >= 16 (CI uses Node 20.x; 16+ is minimum)
- Docker (optional — only required if you want to run services in containers)

Top-level references
- Root env template: [`.env.example`](.env.example:1)
- Per-app env examples: [`apps/webapp-admin/.env.local.example`](apps/webapp-admin/.env.local.example:1), [`apps/prompt-lab/.env.local.example`](apps/prompt-lab/.env.local.example:1)
- Integration & deployment guide: [`docs/INTEGRATION_AND_DEPLOYMENT.md`](docs/INTEGRATION_AND_DEPLOYMENT.md:1)
- WowDash working copy (standalone template): [`wowdash-admin-dashboard`](wowdash-admin-dashboard:1)

5-step local quickstart (pnpm)
1) Install pnpm and Node.js (if not installed)
   - Example (macOS / Linux): install Node using nvm, then install pnpm:
     - curl -fsSL https://get.pnpm.io/install.sh | sh
2) Bootstrap the workspace (install top-level dependencies)
   - pnpm install
3) Install workspace dependencies (if you need to run an individual app directly)
   - pnpm --filter ./apps/webapp-admin install
   - pnpm --filter ./apps/prompt-lab install
4) Run the monorepo dev command (placeholder)
   - pnpm run dev:all
     - Note: `dev:all` is a placeholder task until a coordinated dev script is added. See "Remaining bootstrap tasks" below.
5) Run the WowDash working copy directly (standalone template)
   - cd wowdash-admin-dashboard
   - npm install
   - npm start
   - Open http://localhost:3000 (or the port shown in the server output)

Exact commands (copy / paste)
- Install dependencies for monorepo:
  - pnpm install
- Placeholder: start all dev servers (when implemented):
  - pnpm run dev:all
- Run a single app (example):
  - pnpm --filter apps/webapp-admin dev
  - pnpm --filter @howaiconnects/prompt-lab dev   # starts the Prompt Lab Vite dev server (see apps/prompt-lab/README.md)
- Run WowDash working copy directly (standalone template):
  - cd wowdash-admin-dashboard/wow-dash-frontend/WowDash && npm install && npm start

Where to place environment files
- Root-level: copy [`.env.example`](.env.example:1) to `.env.root.local` or `.env.local` depending on your workflow (CI loads `.env.root.local` when present — see `.github/workflows/ci.yml`).
- App-level: copy per-app examples to the app directory as `.env.local`:
  - cp apps/webapp-admin/.env.local.example apps/webapp-admin/.env.local
  - cp apps/prompt-lab/.env.local.example apps/prompt-lab/.env.local
- Do NOT commit `.env*.local` files. See secrets workflow: [`docs/SECRETS_WORKFLOW.md`](docs/SECRETS_WORKFLOW.md:1)

Primary env keys (root)
- The root-level example contains the keys the repo expects (e.g., DATABASE_URL, NEXT_PUBLIC_BASE_URL, LATITUDE_*). Use [`.env.example`](.env.example:1) as the canonical template.

Per-app example env files
- Per-app examples live under each app and are intentionally named `.env.local.example` so they are clearly examples (no secrets).

Quick checklist — remaining bootstrapping tasks (upcoming)
- [ ] Prisma migrations & seed scripts (create `prisma/migrations/` & seed flow)
- [ ] `docker-compose.dev.yml` for local services (postgres, redis, qdrant, traefik)
- [ ] Implement `pnpm run dev:all` orchestration (currently a placeholder)
- [ ] Add documented dev: workflows per app in each app's README (apps/webapp-admin README needs Next.js mapping notes)

Notes & tips
- CI uses pnpm v8 in `.github/workflows/ci.yml`; if you see CI failures locally, try aligning your pnpm/node versions with CI.
- If you are unsure about an env key name, consult these authoritative sources:
  - Prisma schema: [`prisma/schema.prisma`](prisma/schema.prisma:1)
  - Integration docs: [`docs/INTEGRATION_AND_DEPLOYMENT.md`](docs/INTEGRATION_AND_DEPLOYMENT.md:1)
  - CI workflow that loads `.env.root.local`: [`.github/workflows/ci.yml`](.github/workflows/ci.yml:1)

This quickstart is intentionally short to get developers booted quickly. The "Quick checklist" shows the near-term scaffolding work planned so contributors know what remains.