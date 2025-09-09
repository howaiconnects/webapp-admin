# Merge Policy and Hotfix Protocol

This document defines the merge policy and hotfix protocol for the How AI Connects monorepo, ensuring safe, consistent changes across the four-branch structure (main, webapp-admin, webapp-user, prompt-lab, playground). It builds on the [branching strategy](branching-strategy.md), emphasizing protected branches, PR reviews, and automated checks to maintain `main` as rock-solid. All merges require GitHub PRs; direct pushes to protected branches are forbidden.

## Merge Policy

### General Rules
- **Protected Branches**: `main`, `webapp-admin`, `webapp-user`, `prompt-lab`, `playground` are protected. Require:
  - At least 1 approval from a maintainer (2 for `main`).
  - All status checks passing (lint, test, build via Turbo).
  - No force-pushes; linear history preferred.
  - Branch name must follow conventions (e.g., `feature/webapp-admin/*`).

- **PR Targeting**:
  - **App-Specific Changes**: Target the relevant app branch (e.g., PR to `webapp-admin` for admin UI).
  - **Shared Changes**: Target `main` (e.g., updates to `packages/adapters`); then sync to app branches via PRs.
  - **Cross-App**: Target `main` if affecting multiple apps; use labels like `cross-app` for visibility.

- **Merge Methods**:
  - **Squash Merge** (default): For feature branches; combines commits into one with a descriptive title/body.
  - **Rebase and Merge**: For hotfixes or when preserving commit history is needed (e.g., detailed audits).
  - **Avoid Merge Commits**: No "messy" merges; use squash/rebase to keep history clean.
  - **Commit Messages**: Conventional Commits (e.g., `feat: add AI chat`, `fix: resolve auth bug`). Enforced by Husky.

- **PR Requirements**:
  - **Description Template**: Use GitHub PR template with sections: Description, Changes, Testing, Related Issues.
  - **Labels**: Required: `type:feat`, `type:fix`, `app:webapp-admin`, `status:needs-review`. Auto-add via actions.
  - **Checks**:
    - **Linting**: ESLint/Prettier (naming conventions, imports).
    - **Tests**: Unit (Jest) + E2E (Playwright) coverage >80%.
    - **Build**: Turbo build for affected apps/packages.
    - **Security**: Snyk or similar for deps; adapter health checks.
  - **Reviews**: Code owner reviews for packages/ (e.g., adapters); self-approve trivial changes (<50 lines).
  - **DCO**: Sign-off commits (Developer Certificate of Origin).

- **PR Controls for Breaking Changes**:
  - **Detection**: Use conventional commits with `!` suffix (e.g., `feat!: major API change`) or label `breaking-change`.
  - **Requirements for Breaking PRs**:
    - Mandatory full test matrix run (all apps/packages, including E2E on preview deploys).
    - Manual approval from 2 maintainers (escalated review).
    - Required checklist in PR template: "Impact assessment", "Migration guide", "Backward compat check".
    - Block auto-merge; require status check for "breaking-test-suite" (custom job running compat tests).
    - Target `main` only if cross-app; otherwise, app branch with sync to `main` post-validation.
  - **Enforcement**: GitHub branch protection rules: For `main`, require "breaking-change" label and custom status check. Use actions to auto-label based on commit messages.

- **Auto-Merge**: Enabled for PRs with approvals and passing checks; disabled for breaking changes (manual only).

- **Post-Merge**:
  - Delete source branch.
  - Notify via Slack/GitHub actions.
  - Trigger deploy if to `main` (e.g., preview for apps).

### Syncing Changes
- After merging to `main`, create sync PRs to app branches (e.g., `main` -> `webapp-admin`).
- Frequency: Weekly or on-demand; automate via GitHub action on merge to `main`.

## Hotfix Protocol

Hotfixes address critical production issues (bugs, security) without new features. They bypass standard feature review for speed but maintain safety.

### Steps
1. **Identify Issue**: Triage via GitHub Issues; label `type:bug severity:critical`.
2. **Branch from main**: `git checkout -b hotfix/{issue-number}-{description} main` (e.g., `hotfix/123-auth-bypass`).
3. **Minimal Fix**: Only fix the issue; no refactors/features. Test thoroughly (manual + automated).
4. **PR to main**: Target `main`; title: `hotfix: {brief description}`. Expedited review (1 approval, 1 hour SLA).
5. **Merge**: Squash merge; pass all checks.
6. **Propagate to Apps**: Cherry-pick commit to affected app branches (e.g., `git cherry-pick <commit-hash>` on `webapp-admin`); create PRs for each.
7. **Release**: Tag on `main` (e.g., `v1.0.1-hotfix`); deploy immediately.
8. **Document**: Update CHANGELOG.md; close related issue.

### Examples
- Security vuln in adapters: Hotfix to `main`, then cherry-pick to all app branches.
- App-specific crash in webapp-user: Hotfix directly to `webapp-user` branch, then PR to `main` if shared.

### Enforcement
- **GitHub Settings**: 
  - Require status checks for hotfix PRs (but allow bypassing reviews for urgency via admin).
  - Dismiss stale approvals on push.
  - Required reviewers: Code owners file (CODEOWNERS) for paths (e.g., `@maintainer packages/adapters/*`).
- **Tools**: 
  - GitHub Actions: Validate PR labels, auto-assign reviewers.
  - Dependabot: Auto-hotfix security deps.
- **Auditing**: Log merges to Airtable/Supabase for compliance.

### Exceptions
- Emergency: Direct merge to `main` by 2 maintainers (rare; document in ADR).
- Review Escalation: If blocked, ping in #dev channel.

This policy minimizes risk while enabling rapid fixes. Aligns with branching strategy; update via ADR for changes.