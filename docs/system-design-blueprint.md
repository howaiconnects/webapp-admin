# System-Design Blueprint: How AI Connects Monorepo Four-Branch Split

This blueprint provides a complete plan for reorganizing the How AI Connects monorepo into a clean four-branch structure (main as foundational, webapp-admin, webapp-user, prompt-lab, playground as app-specific) while preserving `main` as rock-solid. It synthesizes all prior docs: repo structure, branching, tooling, CI/CD, routes/APIs, secrets, documentation, milestones, risks, and questions. Implementation follows milestones; total effort ~26 days.

## High-Level Architecture Diagram (ASCII)

```
+------------------------------------------+
| How AI Connects Monorepo (Turborepo/pnpm)|
+------------------------------------------+
| Root: turbo.json | pnpm-workspace.yaml  |
| .env.example | tsconfig.base.json      |
+-------------+--------------------------+
| Packages (Shared)                      |
| +------------------------------------+ |
| | adapters/ (Latitude, Airtable, Miro)| |
| | auth/ | ui/ | utils/ | contracts/  | |
| +------------------------------------+ |
+-------------+--------------------------+
| Apps (Deployable, Branch-Specific)      |
| +------------+  +------------+  +------+ |
| | webapp-admin | webapp-user |  | ... | |
| | (Next.js)   | (Next.js)   |  |      | |
| | /admin/*    | /user/*     |  |      | |
| +------------+  +------------+  +------+ |
| Dependencies: ^packages/* via aliases   |
+-------------+--------------------------+
| Infra: docker-compose.yml | GitHub     |
| Workflows (CI/CD matrix)             |
+-------------+--------------------------+
| Docs: CONTRIBUTING.md | ADRs | Guides |
+---------------------------------------+

Branch Flow (Linear):
main (prod-ready) <-- PRs from Features/Hotfixes
                    |
                    +--> webapp-admin (admin app)
                    +--> webapp-user (user app)
                    +--> prompt-lab (backend)
                    +--> playground (sandbox)

Sync: Weekly PRs main -> app branches
```

- **Key**: Shared packages feed apps; branches isolate deploys; CI/CD gates merges.

## Ordered Task List with Estimates and Dependencies

Derived from [milestones.md](milestones.md); sequential with dependencies.

1. **Implement Repo Tree** (Effort: 2 days, Dep: None)
   - Create folders per [proposed-repo-structure.md](proposed-repo-structure.md).
   - Migrate existing files (e.g., adapters to packages/).

2. **Set Up Branches and Protections** (Effort: 1 day, Dep: Task 1)
   - Create branches; apply GitHub protections per [branching-strategy.md](branching-strategy.md) and [merge-policy.md](merge-policy.md).

3. **Apply Naming Conventions** (Effort: 2 days, Dep: Task 1)
   - Refactor files/routes per [naming-conventions.md](naming-conventions.md); ESLint rules.

4. **Configure Environment/Tooling** (Effort: 3 days, Dep: Task 2)
   - Set .nvmrc, Turbo tasks, Docker services per [environment-tooling.md](environment-tooling.md).

5. **Implement CI/CD Workflows** (Effort: 4 days, Dep: Task 4)
   - Create .yml files in infra/github/; test matrix per [ci-cd-pipeline.md](ci-cd-pipeline.md).

6. **Set Up Routes/APIs and Contracts** (Effort: 3 days, Dep: Task 3)
   - Migrate to App Router; tRPC schemas in packages/contracts per [route-api-guidelines.md](route-api-guidelines.md).

7. **Configure Secrets Management** (Effort: 2 days, Dep: Task 5)
   - .env templates, Vault integration per [secrets-management.md](secrets-management.md).

8. **Build Documentation** (Effort: 3 days, Dep: Task 6)
   - CONTRIBUTING.md, app READMEs, ADR template per [documentation-plan.md](documentation-plan.md).

9. **Migrate and Test Code** (Effort: 5 days, Dep: All prior)
   - Move apps to branches; integrate adapters; E2E tests.

10. **Deploy and Validate** (Effort: 5 days, Dep: Task 9)
    - Prod deploy from main; previews for branches.

**Total Estimate**: 30 days (with buffer); Dependencies: Sequential within milestones.

## Risk Assessment and Mitigation Steps

Summary from [risk-assessment.md](risk-assessment.md); top risks:

- **R001: Merge Conflicts** (Med/High): Mitigate with rebase, weekly syncs; test in M1.
- **R002: Secrets Exposure** (Low/Critical): Hooks and scans; validate in M2.
- **R003: CI Failures** (Med/Med): Optimize matrix; monitor in M2.
- **R007: Downtime** (Med/High): Blue-green deploys; rollback in M4.
- **R010: Scope Creep** (High/High): Gate milestones; freeze features in M4.

Full table in risk-assessment.md; contingency: 20% buffer.

## Open Questions and Assumptions Requiring Stakeholder Input

From [open-questions.md](open-questions.md):

1. **Secrets Backend**: Assumption: Vault. Suggestion: Confirm vs. AWS; vote in review.
2. **API Tech**: Assumption: tRPC. Suggestion: Prototype; input on external needs.
3. **Deployment Target**: Assumption: Vercel + Docker. Suggestion: Specify provider/budget.
4. **Monitoring**: Assumption: Sentry. Suggestion: Approve or choose alternative.
5. **DB Scaling**: Assumption: Supabase. Suggestion: Evaluate load in M4.

**Next**: Schedule review; resolve in ADRs. Once approved, switch to code mode for implementation.

This blueprint is ready for review; provides a solid path to the split.