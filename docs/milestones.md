# Milestones and Acceptance Criteria

This document defines phased milestones for implementing the system-design blueprint in the How AI Connects monorepo, focusing on the four-branch split (main, webapp-admin, webapp-user, prompt-lab, playground). Each milestone includes tasks (from the todo list), estimated effort (in days), dependencies, and acceptance criteria (verifiable outcomes). Total timeline: 4-6 weeks, assuming 1-2 devs. Track via GitHub Project board; review at end of each milestone.

## Milestone 1: Foundation Setup (Week 1, Effort: 5 days)
**Goal**: Establish repo structure, branching, and basic configs for the split.

**Tasks**:
- Implement proposed repo tree ([proposed-repo-structure.md](proposed-repo-structure.md)).
- Set up branches and protections ([branching-strategy.md](branching-strategy.md), [merge-policy.md](merge-policy.md)).
- Apply naming conventions ([naming-conventions.md](naming-conventions.md)).

**Dependencies**: Existing codebase (adapters, apps).

**Acceptance Criteria**:
- [ ] Repo tree matches proposed structure (verify with `tree` command or VS Code explorer).
- [ ] Branches created: `main` (protected), `webapp-admin`, `webapp-user`, `prompt-lab`, `playground` (all protected per policy).
- [ ] Root configs updated: turbo.json, pnpm-workspace.yaml, .nvmrc (Node 18.20).
- [ ] Sample PR from feature branch to app branch merges successfully with checks passing.
- [ ] No lint errors on `pnpm lint` across root.
- [ ] Documentation: CONTRIBUTING.md drafted with setup steps.

## Milestone 2: Tooling and Infrastructure (Week 2, Effort: 7 days)
**Goal**: Configure environments, CI/CD, secrets, and APIs for consistent development.

**Tasks**:
- Enforce environment/tooling ([environment-tooling.md](environment-tooling.md)).
- Implement CI/CD workflows ([ci-cd-pipeline.md](ci-cd-pipeline.md)).
- Set up route/API guidelines and contracts ([route-api-guidelines.md](route-api-guidelines.md)).
- Configure secrets management ([secrets-management.md](secrets-management.md)).

**Dependencies**: Milestone 1 (structure in place).

**Acceptance Criteria**:
- [ ] Local dev: `pnpm dev:all` runs all apps without errors; Docker services (Postgres/Redis) spin up via docker-compose.
- [ ] CI: PR triggers lint/test/build matrix; all pass for a test PR (coverage >80%).
- [ ] Secrets: .env.example populated; runtime validation with Zod throws on missing vars; GitHub Secrets set for 3 sample vars (e.g., DB_URL).
- [ ] APIs: Sample tRPC router in packages/contracts; client query works in webapp-admin without type errors.
- [ ] Preview Deploy: PR deploys to Vercel preview URL accessible.
- [ ] Audit: No exposed secrets in git log; Vault policy tested locally.

## Milestone 3: Documentation and Refinements (Week 3, Effort: 4 days)
**Goal**: Finalize docs and address gaps before implementation.

**Tasks**:
- Build documentation structure ([documentation-plan.md](documentation-plan.md)).
- Define risks/mitigations and open questions.

**Dependencies**: Milestones 1-2 (tooling ready).

**Acceptance Criteria**:
- [ ] Docs site: MkDocs/Docusaurus built from docs/; all links work (e.g., to architecture files).
- [ ] Per-App READMEs: Each app has README.md matching template; includes quickstart tested.
- [ ] ADRs: At least 2 created (e.g., ADR-001: Branch Strategy Accepted).
- [ ] Risk doc: Compiled with 5+ risks and mitigations; questions listed with assumptions.
- [ ] Review: Team walkthrough of blueprint docs; feedback incorporated.

## Milestone 4: Implementation and Validation (Weeks 4-6, Effort: 10 days)
**Goal**: Migrate code to new structure, test end-to-end, launch split.

**Tasks**:
- Migrate apps/packages to new branches (e.g., rename unified-webapp to webapp-user).
- Integrate adapters/UI in apps.
- Full E2E testing and prod deploy.

**Dependencies**: All prior milestones.

**Acceptance Criteria**:
- [ ] Branches Active: Each app branch builds/deploys independently; shared changes from main sync via PR.
- [ ] Code Migration: 100% coverage; no breaking changes (tests pass pre/post).
- [ ] Features: Admin dashboard with AI/CRM; user chat works; prompt-lab adapters functional.
- [ ] Performance: Builds <5min; deploys to prod without downtime.
- [ ] Security: Scans pass; secrets not in artifacts.
- [ ] Launch: Prod on main; previews for branches; monitoring (Sentry) active.

## Overall Success Criteria
- [ ] Blueprint Fully Implemented: All docs/enforcement in place; repo ready for ongoing development.
- [ ] Metrics: CI pass rate >95%; docs coverage (e.g., 90% files have README).
- [ ] Handover: Switch to code mode for refinements; user approval on blueprint.

## Risks and Timeline Adjustments
- Delay if CI setup complex: Mitigate with parallel work.
- Total: 26 days; buffer 20% for reviews.

Track progress in GitHub Issues/Milestones; adjust via ADR.