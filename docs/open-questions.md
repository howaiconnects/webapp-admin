# Open Questions, Assumptions, and Suggestions

This document addresses open questions from the system-design blueprint for the How AI Connects monorepo, focusing on areas requiring clarification (e.g., secrets backend, API tech, deployment target). For each, I provide assumptions based on best practices and existing codebase (e.g., Supabase, tRPC, Vercel), along with suggestions for resolution. These are flagged for stakeholder input; resolve via ADR in `docs/ADR/`. Once clarified, update this doc and milestones.

## 1. Secrets Backend
**Question**: What is the preferred secrets backend for prod (e.g., HashiCorp Vault vs. AWS Secrets Manager vs. GitHub Secrets only)? Current plan uses Vault for scale, but if cloud-specific, adjust.

**Assumptions**:
- Multi-cloud avoidance; Vault as neutral choice (OIDC integration with GitHub Actions).
- Local/CI uses .env/GitHub Secrets; prod needs encrypted, audited storage.
- Existing Supabase integration implies Postgres secrets are handled there, but adapters (Latitude) need per-app keys.

**Suggestions**:
- Option 1: Vault (recommended for monorepo; free self-hosted, policies for branches).
- Option 2: Cloud-native (e.g., AWS SSM if deploying to AWS; add IAM roles).
- Resolution: Stakeholder vote; implement in Milestone 2. Cost: Low (Vault open-source). Test in playground branch.

## 2. API Tech
**Question**: Confirm tRPC as primary API tech (vs. full OpenAPI/REST or GraphQL)? Guidelines assume tRPC for type-safety with adapters, but if external consumers need OpenAPI docs.

**Assumptions**:
- Internal APIs (admin/user) use tRPC for end-to-end types (React/Next.js stack).
- Adapters expose via tRPC procedures (e.g., runPrompt mutation).
- External (e.g., Zapier) uses REST with OpenAPI spec generated from tRPC.
- No GraphQL due to complexity; tRPC aligns with [route-api-guidelines.md](route-api-guidelines.md).

**Suggestions**:
- Stick with tRPC + @trpc/openapi for hybrid (type-safe internal, documented external).
- If GraphQL needed: Apollo Federation, but adds overhead.
- Resolution: Prototype tRPC in webapp-admin API; measure perf. Update contracts package. Input: External API consumers?

## 3. Deployment Target
**Question**: What is the primary deployment platform (Vercel for Next.js apps, Docker/K8s for prompt-lab, or unified like Heroku)? Affects CI/CD and secrets.

**Assumptions**:
- Vercel for webapp-admin/user (serverless, previews align with branches).
- Docker Compose for local; prod Docker for prompt-lab/playground (infra/docker/).
- No monolith; per-app deploys from branches (main for prod).
- Cost: Vercel hobby free; scale to pro.

**Suggestions**:
- Option 1: Vercel for all web apps (easy, integrated with GitHub); Docker for backend (prompt-lab) to ECS/Fargate.
- Option 2: Unified Kubernetes if multi-app orchestration needed.
- Resolution: Define in [ci-cd-pipeline.md](ci-cd-pipeline.md); test deploy in Milestone 4. Input: Budget/cloud provider preference?

## Additional Open Questions
- **Monitoring**: Sentry or Datadog? Assumption: Sentry (free tier, GitHub integration). Suggestion: Add to environment-tooling.md.
- **Database Scaling**: Supabase sufficient, or migrate to dedicated Postgres? Assumption: Supabase for now. Suggestion: Evaluate in M4.
- **Testing Coverage**: 80% threshold ok? Assumption: Yes. Suggestion: Adjust based on risk assessment.

## Next Steps
- **Stakeholder Input**: Schedule review call; document responses in ADR.
- **Assumptions Validation**: Test in playground; if invalid, revert via hotfix.
- **Timeline Impact**: Delays if unresolved; prioritize in Milestone 3.

This ensures the blueprint is robust; finalize before implementation.