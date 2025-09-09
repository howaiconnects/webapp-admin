# Secrets Workflow

## Overview
- Keep secrets in `.env*.local` files (these are never committed)
- Use `.env.example` files as templates
- Pre-commit hook prevents accidentally committing secret files

## Rules
1. Never commit files matching `.env*.local`
2. Use `.env.example` as a template for environment variables
3. Pre-commit hook automatically blocks secret files

## Developer Setup
1. Copy `.env.example` to `.env.local` and fill in your values
2. The pre-commit hook will prevent you from accidentally committing secrets

That's it! Simple and secure.

---

Note for maintainers & contributors (CI bootstrapping)

- CI workflows expect a root env file. Locally you can create it from the example:
  - cp .env.root.example .env.root.local

- To quickly bootstrap CI-like checks locally (configures git safe directory and generates Prisma client):
  - pnpm ci:bootstrap

- Ensure the helper script is executable locally and in CI. Code-mode could not set the executable bit for you; run one of these:
  - chmod +x scripts/ci-git-config.sh
  - git update-index --chmod=+x scripts/ci-git-config.sh

- The ci:bootstrap step runs:
  - ./scripts/ci-git-config.sh && pnpm -w prisma generate

This will configure git for CI usage and generate the Prisma client used by the repo.