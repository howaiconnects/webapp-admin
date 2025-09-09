# Environment and Tooling Constraints

This document specifies the environment and tooling constraints for the How AI Connects monorepo to ensure consistency across the four-branch split (main, webapp-admin, webapp-user, prompt-lab, playground). Constraints are enforced via `.nvmrc`, `engines` in package.json, and CI checks. This promotes reproducibility, security, and performance in development, testing, and production.

## 1. Runtime Environment

- **Node.js Version**: >=18.20.0 (LTS). Use even-numbered LTS releases for stability.
  - Enforcement: `.nvmrc` at root with `18.20.0`; `engines` in root package.json: `"node": ">=18.20.0"`.
  - Rationale: Supports Next.js 14+, ES modules, and adapters (e.g., airtable ^0.12 requires Node 18+).
  - Upgrade Policy: Test on next LTS (e.g., 20.x) before updating; document in ADR.

- **Operating System**: macOS/Linux preferred; Windows via WSL2 for compatibility.
  - Constraints: Docker for cross-platform services; avoid OS-specific paths.

- **Memory/CPU**: Dev: 8GB+ RAM; CI: GitHub-hosted runners (2-core, 7GB).

## 2. Package Manager

- **Required**: pnpm >=9.0.0 (fast, disk-efficient for monorepos).
  - Enforcement: Root `.npmrc` with `shamefully-hoist=false`; scripts use `pnpm`.
  - Prohibited: npm/yarn (conflicts with workspaces); check via Husky pre-install.
  - Lockfile: `pnpm-lock.yaml` at root; commit always.

## 3. Build and Task Orchestration (Turborepo)

- **Turbo Config**: `turbo.json` at root defines pipelines for caching and parallel execution.
  - **Key Tasks**:
    - `build`: Builds apps/packages (e.g., `turbo run build --filter=webapp-admin`); outputs to `dist/`.
    - `dev`: Runs dev servers (e.g., `turbo run dev --parallel` for all apps).
    - `test`: Runs Jest/Playwright (e.g., `turbo run test --filter=./packages/*`); coverage threshold 80%.
    - `lint`: ESLint/Prettier (e.g., `turbo run lint --filter=...`); fix with `--fix`.
    - `type-check`: TSC (e.g., `turbo run type-check`); noEmit true.
    - `e2e`: Playwright tests (e.g., `turbo run e2e --filter=webapp-user`).
  - **Dependencies**: Task graph in turbo.json (e.g., `build` depends on `^build` for packages).
  - **Caching**: Enabled for build/test; remote cache via Vercel or GitHub.
  - **Constraints**: All tasks must be idempotent; no global state. Run from root.

- **Scripts**: Root `package.json` scripts wrap Turbo (e.g., `"dev:all": "turbo run dev"`).

## 4. Docker Services

- **Local Development**: `infra/docker-compose.yml` for services; run `docker compose up -d`.
  - **Services**:
    - **Postgres**: For Supabase-like DB (version 15+); env: `DB_SUPABASE_URL=postgres://...`.
    - **Redis**: Caching/queues (version 7+); env: `REDIS_URL=redis://localhost:6379`.
    - **Proxy/NGINX**: For multi-app routing (e.g., admin.localhost:3000).
    - **App Containers**: Per-app Dockerfiles (e.g., `Dockerfile.webapp-admin` with multi-stage build).
  - **Volumes**: Persist DB data; mount code for hot-reload in dev.
  - **Constraints**: Services must be optional (fallback to local for quick dev); health checks required.
  - **Prod**: Kubernetes/Docker Swarm; no dev services in prod images.

- **Build**: `docker build -f infra/docker/Dockerfile.{app} -t howai/{app}:latest .`
  - Base Image: `node:18-alpine` for size/security.

## 5. Other Tooling Constraints

- **TypeScript**: >=5.0; strict mode enabled; path aliases via `tsconfig.base.json`.
- **React/Next.js**: React 18+, Next.js 14+ (App Router only; deprecate Pages Router).
- **CSS**: Tailwind CSS 3+; per-app configs, shared theme in `packages/ui`.
- **Testing**: Jest 29+ for units, Playwright for E2E; mocks for adapters/external APIs.
- **Linting/Formatting**: ESLint 8+ with @typescript-eslint, Prettier 3+; enforce conventions.
- **IDE**: VS Code recommended; extensions: Tailwind IntelliSense, ESLint.
- **Dependencies**: Audit weekly (Dependabot); no unused deps (pnpm audit).
- **Security**: Snyk for scans; env vars validated at runtime (e.g., zod for adapters).

## Enforcement and Onboarding

- **CI Gates**: GitHub Actions run Turbo tasks on PRs; fail if constraints violated (e.g., Node version check).
- **Local Setup**: `scripts/setup.mjs` installs tools, checks versions.
- **Documentation**: Update README.md with `npx turbo run setup`; ADR for tool changes.

This setup ensures a constrained, predictable environment. Violations block merges; propose changes via ADR.