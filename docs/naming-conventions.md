# Naming Conventions

This document establishes consistent naming standards for the How AI Connects monorepo to ensure readability, maintainability, and alignment with the four-branch split (main, webapp-admin, webapp-user, prompt-lab, playground). Conventions are derived from existing code (e.g., kebab-case in apps/, UPPER_SNAKE_CASE env vars) and best practices for Turborepo/Next.js/pnpm workspaces. Violations should be caught by ESLint/Prettier in CI.

## 1. Folders and Files

- **General Rule**: Use kebab-case (lowercase with hyphens) for directories and files to match filesystem norms and URL-friendly paths. Avoid camelCase or PascalCase except for code identifiers.
  - Examples:
    - Directories: `webapp-admin/`, `latitude-adapter/`, `api-routes/`
    - Files: `admin-navigation.tsx`, `base-adapter.ts`, `docker-compose.yml`

- **Apps**: Each app folder matches its branch name (e.g., `apps/webapp-admin/`).
  - Subfolders: `app/` (Next.js App Router), `components/`, `lib/`, `public/`, `tests/`.

- **Packages**: Scoped as `@howaiconnects/{name}` in package.json, with folders like `adapters/`, `auth/`.
  - Subfolders: `src/`, `types/`, `__tests__/`, `dist/` (built output).

- **Infra**: `infra/docker/`, `infra/github/workflows/`.
  - Files: `Dockerfile.{app-name}`, `{workflow-name}.yml`.

- **Docs**: `docs/architecture/`, `docs/adapters/`.
  - Files: `{topic}-{detail}.md` (e.g., `adapter-interface-spec.md`).

- **Scripts**: `scripts/{purpose}.mjs` (e.g., `dev-all.mjs`).

- **Exceptions**: `__tests__/` (Jest convention), `node_modules/` (npm standard).

## 2. Routes (Next.js App Router)

- **General Rule**: Use kebab-case for dynamic segments and hyphens for multi-word paths. Prefix with app context (e.g., `/admin/`, `/user/`).
  - Static: `/admin/dashboard`, `/user/chat`
  - Dynamic: `/admin/crm/[baseId]`, `/prompt-lab/[promptId]`
  - Nested: `/admin/ai/prompts/[id]/edit`

- **API Routes**: `/api/{app}/{resource}` (e.g., `/api/admin/prompt`, `/api/user/chat`).
  - Avoid legacy `/pages/api/`; migrate to `app/api/` route.ts files.

- **Branch Alignment**: Routes in `webapp-admin/` stay under `/admin/*`; `webapp-user/` under `/user/*`.

- **Validation**: Use `generateStaticParams` for dynamic routes; enforce with TypeScript.

## 3. Environment Files and Variables

- **Files**:
  - Root: `.env.example` (shared vars), `.env.local` (uncommitted local overrides).
  - Per-App: `{app-name}/.env.local.example` (app-specific), e.g., `apps/webapp-admin/.env.local.example`.
  - Format: No quotes around values; one var per line.

- **Variables**:
  - **Prefixing**: Use prefixes for scoping:
    - `NEXT_PUBLIC_` for client-side (e.g., `NEXT_PUBLIC_APP_URL`).
    - `APP_` for app-specific (e.g., `APP_ADMIN_API_KEY`, `APP_USER_JWT_SECRET`).
    - `DB_` for database (e.g., `DB_SUPABASE_URL`).
    - `ADAPTER_` for integrations (e.g., `ADAPTER_LATITUDE_API_KEY`, `ADAPTER_AIRTABLE_BASE_ID`).
  - **Casing**: UPPER_SNAKE_CASE for all env vars.
  - **Defaults**: Provide fallbacks in code (e.g., `process.env.ADAPTER_LATITUDE_API_KEY || ''`).
  - **Secrets**: Never commit real values; use `.env.example` with placeholders (e.g., `ADAPTER_LATITUDE_API_KEY=your_key_here`).

- **Management**: For prod, use Vault or GitHub Secrets; local Docker-compose overrides via `env_file`.

## 4. Tests

- **Structure**: `__tests__/` folder at package/app root; or co-located `*.test.ts` next to source.
  - Examples: `packages/adapters/__tests__/latitude-adapter.test.ts`, `apps/webapp-admin/tests/api/prompt.test.ts`.

- **Naming**: `{unit}.{test|spec}.{ts|tsx}` (e.g., `base-adapter.test.ts`, `admin-chat.spec.tsx`).
  - Describe blocks: `describe('LatitudeAdapter', () => { ... })`.
  - Test files for E2E: `*.e2e.ts` in `tests/e2e/`.

- **Tools**: Jest for units, Playwright for E2E. Mock external APIs (e.g., `@howaiconnects/adapters` mocks).

- **Coverage**: Aim for 80%+; enforce via Turbo tasks (`turbo run test --filter=...`).

## 5. TypeScript Path Aliases (tsconfig)

- **Base Config**: In `tsconfig.base.json` at root:
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@howaiconnects/*": ["packages/*/src/*"],
        "@howaiconnects/adapters": ["packages/adapters/src"],
        "@howaiconnects/adapters/*": ["packages/adapters/src/*"],
        "@howaiconnects/auth": ["packages/auth/src"],
        // Extend for ui, utils, contracts
      }
    }
  }
  ```

- **App-Specific**: Each app's `tsconfig.json` extends base:
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "paths": {
      // App-specific if needed, e.g., "@/components/*": ["./components/*"]
    }
  }
  ```

- **Next.js/Vite Config**: Mirror aliases in `next.config.js` or `vite.config.ts`:
  ```js
  // next.config.js
  resolve.alias = {
    ...resolve.alias,
    '@howaiconnects/adapters': path.resolve(__dirname, '../../packages/adapters/src'),
  };
  ```

- **Usage in Code**: Import as `import { LatitudeAdapter } from '@howaiconnects/adapters';`.

## Enforcement and Tools

- **Linting**: ESLint rules for naming (e.g., `@typescript-eslint/naming-convention`).
- **Prettier**: For consistent formatting.
- **Husky**: Pre-commit hooks to validate names/conventions.
- **Review Process**: PRs must adhere; use GitHub templates for checklists.

This ensures consistency across the monorepo and branches. Update as new patterns emerge via ADRs.