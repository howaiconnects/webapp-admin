# Documentation Structure Plan

This document plans the documentation structure for the How AI Connects monorepo, centralizing knowledge in the `docs/` folder to support onboarding, maintenance, and the four-branch split. It ensures comprehensive, up-to-date guides for contributors, with templates for CONTRIBUTING.md, per-app READMEs, and ADRs. Follow [naming-conventions.md](naming-conventions.md) for file names (e.g., `{topic}.md`).

## Overall Structure (docs/)

Organize into subfolders for scalability:

```
docs/
├── README.md                          # Docs overview, how to contribute to docs
├── CONTRIBUTING.md                    # Contribution guidelines (below)
├── ADR/                               # Architecture Decision Records (below)
│   ├── adr-001-branching-strategy.md  # Example: Decision on Git Flow
│   └── template.md                    # ADR template (below)
├── architecture/                      # High-level designs
│   ├── system-design-blueprint.md     # Full blueprint (references all docs)
│   ├── proposed-repo-structure.md     # Repo tree
│   └── branching-strategy.md          # Git diagrams
├── adapters/                          # Integration specs
│   └── adapter-interface-spec.md      # BaseAdapter details
├── development/                       # Dev guides
│   ├── environment-tooling.md         # Node/Docker constraints
│   ├── ci-cd-pipeline.md              # Workflow details
│   ├── secrets-management.md          # Env/Vault
│   └── route-api-guidelines.md        # App Router/tRPC
├── apps/                              # Per-app guides (symlink or copy from app/README.md)
│   ├── webapp-admin.md                # Admin setup
│   └── ...                            # One per app
└── integrations/                      # Third-party (Latitude, Airtable)
    └── latitude-setup.md              # API key config
```

- **Maintenance**: Auto-generate indexes (e.g., via script); link cross-refs (e.g., [see branching-strategy.md]).
- **Tools**: MkDocs or Docusaurus for site; commit to `main` and deploy via CI.

## CONTRIBUTING.md Outline

Place at root; covers how to contribute across branches.

Content Sections:
1. **Introduction**: "Welcome to How AI Connects! We use Git Flow with app branches; see [branching-strategy.md](docs/branching-strategy.md)."
2. **Setup**: 
   - Clone: `git clone <repo> && pnpm install`.
   - Env: Copy `.env.example` to `.env.local`; fill secrets.
   - Dev: `pnpm dev:all` (Turbo runs all apps).
   - Node: Use `.nvmrc` (18.20).
3. **Branching & PRs**: Follow [merge-policy.md](docs/merge-policy.md); create feature branches from `main`.
4. **Code Standards**: Naming from [naming-conventions.md](docs/naming-conventions.md); lint/test before commit.
5. **Testing**: Run `pnpm test`; E2E for apps.
6. **Documentation**: Update docs/ for changes; use ADRs for big decisions.
7. **Issues**: Label PRs (e.g., `app:webapp-admin`); close via keywords.
8. **Code Owners**: See CODEOWNERS for reviews.

Example: Link to [environment-tooling.md](docs/environment-tooling.md) for tools.

## Per-App README.md Templates

Each app (e.g., `apps/webapp-admin/README.md`) has its own; template for consistency.

Template:
```
# {App Name} (e.g., WebApp Admin Dashboard)

## Overview
Internal admin hub for AI prompts, CRM, and integrations. Uses Next.js App Router; see [route-api-guidelines.md](docs/route-api-guidelines.md).

## Quickstart
1. cd apps/webapp-admin
2. pnpm install
3. Copy .env.local.example to .env.local; add APP_ADMIN_API_KEY.
4. pnpm dev  # Runs on localhost:3001
5. Access /admin/dashboard.

## Dependencies
- Next.js 14+
- @howaiconnects/adapters for integrations
- Tailwind CSS for styling

## Structure
- app/: Routes (admin/ai, admin/crm)
- components/: UI (AdminNavigation.tsx)
- lib/: Utils (auth checks)

## Testing
pnpm test  # Units
pnpm e2e   # Playwright

## Deployment
See [ci-cd-pipeline.md](docs/ci-cd-pipeline.md); Vercel for previews/prod.

## Related Docs
- [secrets-management.md](docs/secrets-management.md) for env vars.
```

- Customize per app (e.g., Vite for prompt-lab); include screenshots if complex.

## ADR Template

ADRs in `docs/ADR/` for decisions (e.g., choosing tRPC over REST). Use MADR format.

Template (`docs/ADR/template.md`):
```
# ADR {Number}: {Title} (e.g., Adopt tRPC for APIs)

Date: YYYY-MM-DD
Status: Proposed/Accepted/Deprecated
Technical Story: Brief problem/context.
Decision: Chosen solution (e.g., tRPC for type safety).
Options Considered: 1. REST+OpenAPI, 2. GraphQL, 3. tRPC (selected).
Consequences: Pros (end-to-end types), Cons (learning curve).
References: Links to [route-api-guidelines.md](docs/route-api-guidelines.md).
```

- Numbering: Sequential (001-branching, 002-secrets-vault).
- Process: Propose in PR to `main`; approve via reviews.

## Enforcement and Maintenance

- **CI**: Check for missing docs in PRs (e.g., action to validate README updates).
- **Onboarding**: Link CONTRIBUTING.md in repo description.
- **Updates**: Review quarterly; use changelog for docs changes.

This plan centralizes knowledge; implement in code mode post-approval.