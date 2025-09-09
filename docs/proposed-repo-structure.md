# Proposed Repository Directory Structure

This document outlines the proposed structure for the How AI Connects monorepo, designed to support a clean four-branch split (main, webapp-admin, webapp-user, prompt-lab, playground) while maintaining a rock-solid main branch. The structure follows Turborepo/pnpm workspace conventions for shared dependencies, with clear separation of concerns: deployable apps, shared libraries, infrastructure, and documentation. This ensures scalability, modularity, and ease of maintenance.

## High-Level Overview

- **Root Level**: Core config files (turbo.json, pnpm-workspace.yaml, .gitignore, README.md).
- **apps/**: Deployable applications (Next.js/Vite scaffolds), each with its own branch for isolation.
- **packages/**: Shared libraries (adapters, auth, UI components) for cross-app reuse.
- **infra/**: Infrastructure as code (Docker, CI/CD workflows).
- **docs/**: Architecture docs, ADRs, and guides.
- **scripts/**: Build/dev orchestration scripts.

## Detailed Directory Tree

```
howaiconnects-webapp/ (monorepo root)
├── README.md                          # High-level project overview, quickstart
├── turbo.json                         # Turborepo pipeline config (build, test, lint tasks)
├── pnpm-workspace.yaml                # Defines workspaces (apps/*, packages/*)
├── .gitignore                         # Standard ignores + node_modules, .env.local
├── .env.example                       # Root-level env vars (shared across apps)
├── tsconfig.base.json                 # Base TypeScript config (path aliases)
├── package.json                       # Root dependencies (Turborepo, pnpm, linting tools)
├── pnpm-lock.yaml                     # Lockfile for workspaces
│
├── apps/                              # Deployable apps (each can be branched independently)
│   ├── webapp-admin/                  # Admin dashboard (internal operators) - Next.js App Router
│   │   ├── app/                       # App Router pages (admin/dashboard, admin/ai, admin/crm)
│   │   ├── components/                # App-specific React components (AdminNavigation, AdminHeader)
│   │   ├── lib/                       # App-specific utils (auth checks, API clients)
│   │   ├── public/                    # Static assets (logos, icons)
│   │   ├── tests/                     # App-specific tests (e2e with Playwright)
│   │   ├── next.config.js             # Next.js config (aliases to packages)
│   │   ├── tailwind.config.js         # Tailwind theme (admin-specific)
│   │   ├── tsconfig.json              # Extends base, app-specific paths
│   │   ├── package.json               # App deps (Next.js, React, @howaiconnects/*)
│   │   └── .env.local.example         # App-specific env (ADMIN_API_URL, etc.)
│   │
│   ├── webapp-user/                   # Public customer dashboard - Next.js App Router (renamed from unified-webapp)
│   │   ├── app/                       # Pages (user/chat, user/profile)
│   │   ├── components/                # User-facing UI (ChatInterface, ProfileCard)
│   │   ├── lib/                       # User utils (chat history, public auth)
│   │   ├── public/                    # User assets
│   │   ├── tests/                     # User tests
│   │   ├── next.config.js
│   │   ├── tailwind.config.js         # User theme (lightweight)
│   │   ├── tsconfig.json
│   │   ├── package.json               # Deps focused on public features
│   │   └── .env.local.example         # USER_API_URL, etc.
│   │
│   ├── prompt-lab/                    # Backend prompt-management (Latitude, Miro, Airtable) - Vite/React
│   │   ├── src/                       # Source (adapters integration, prompt editor)
│   │   ├── public/                    # Lab assets
│   │   ├── tests/                     # Integration tests for adapters
│   │   ├── vite.config.ts             # Vite config
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   ├── package.json               # Deps: Vite, adapters, testing libs
│   │   └── .env.local.example         # LAB_LATITUDE_KEY, etc.
│   │
│   └── playground/                    # Staging & experimental sandbox - Next.js/Vite hybrid
│       ├── app/                       # Experimental pages
│       ├── components/                # Sandbox UI
│       ├── lib/                       # Experimental utils
│       ├── public/
│       ├── tests/                     # Smoke tests
│       ├── next.config.js (or vite.config.ts)
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       ├── package.json               # Minimal deps for experiments
│       └── .env.local.example         # PLAYGROUND_MODE=experimental
│
├── packages/                          # Shared libraries (not deployable, used via aliases)
│   ├── adapters/                      # Integration adapters (Latitude, Airtable, Miro)
│   │   ├── src/                       # Adapters (latitude-adapter.ts, etc.)
│   │   ├── types/                     # Shared interfaces (IAdapter, BaseAdapter)
│   │   ├── __tests__/                 # Unit tests (mocked APIs)
│   │   ├── tsconfig.json
│   │   ├── package.json               # Deps: airtable, fetch libs
│   │   └── index.ts                   # Barrel exports
│   │
│   ├── auth/                          # Supabase auth helpers
│   │   ├── src/                       # Auth hooks, middleware
│   │   ├── types/                     # Auth types
│   │   ├── __tests__/
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── index.ts
│   │
│   ├── ui/                            # Shared React UI primitives (buttons, modals)
│   │   ├── src/                       # Components (Button.tsx, Modal.tsx)
│   │   ├── types/
│   │   ├── __tests__/
│   │   ├── tsconfig.json
│   │   ├── package.json               # Deps: React, Tailwind
│   │   └── index.ts
│   │
│   ├── utils/                         # Shared utilities (date formatting, validation)
│   │   ├── src/
│   │   ├── types/
│   │   ├── __tests__/
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── index.ts
│   │
│   └── contracts/                     # API contracts (OpenAPI/tRPC schemas)
│       ├── src/                       # Schemas (prompts.schema.ts)
│       ├── types/
│       ├── __tests__/
│       ├── tsconfig.json
│       ├── package.json
│       └── index.ts
│
├── infra/                             # Infrastructure and deployment
│   ├── docker/                        # Dockerfiles for apps
│   │   ├── Dockerfile.admin           # For webapp-admin
│   │   ├── Dockerfile.user            # For webapp-user
│   │   └── docker-compose.yml         # Local stack (Postgres, Redis, proxy)
│   │
│   └── github/                        # CI/CD workflows
│       ├── workflows/                 # .yml files (lint.yml, test.yml, deploy.yml)
│       └── actions/                   # Reusable actions (setup-pnpm.yml)
│
├── docs/                              # Documentation and specs
│   ├── architecture/                  # High-level diagrams (Mermaid for branching)
│   │   └── system-design-blueprint.md # Full blueprint (this doc references it)
│   ├── adapters/                      # Adapter specs (adapter-interface-spec.md)
│   ├── CONTRIBUTING.md                # Contribution guidelines
│   ├── ADR/                           # Architecture Decision Records
│   └── README-apps.md                 # Per-app setup guides
│
└── scripts/                           # Build and dev scripts
    ├── dev-all.mjs                    # Run all apps in dev mode
    ├── build-all.mjs                   # Turbo build all
    └── deploy.mjs                      # Orchestrate deploys
```

## Explanations by Section

### apps/
- Each app is a self-contained workspace with its own deps, config, and .env.example.
- **Branching**: webapp-admin, webapp-user, prompt-lab, playground branch from main; features merge via PRs to specific app branches.
- **Rationale**: Isolates concerns (admin vs. user) while allowing shared packages.

### packages/
- Non-deployable; built via Turbo and aliased in app tsconfigs (e.g., "@howaiconnects/adapters": ["../../packages/adapters/src"]).
- **Rationale**: Promotes DRY principle; adapters are already here, expand for auth/UI.

### infra/
- Docker for local/prod consistency; GitHub Actions for CI/CD matrix builds across apps.
- **Rationale**: Centralizes tooling, supports multi-app pipelines.

### docs/
- Living docs with Mermaid diagrams; ADRs for decisions like branch strategy.
- **Rationale**: Ensures knowledge transfer for the split.

This structure is backward-compatible with existing files (e.g., packages/adapters remains) and scales for the four-branch model. Next steps: Refine based on feedback, then implement via code mode.