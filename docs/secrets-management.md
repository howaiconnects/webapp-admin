# Configuration and Secrets Management Scheme

This document plans the configuration and secrets management for the How AI Connects monorepo, ensuring secure handling of sensitive data (API keys, DB URLs) across the four-branch split. It uses .env files for local/dev, GitHub Secrets for CI/CD, and HashiCorp Vault for prod, with runtime validation. Aligns with [naming-conventions.md](naming-conventions.md) for var naming (UPPER_SNAKE_CASE, prefixed).

## 1. .env Files Structure

- **Root-Level**: `.env.root.local` (new central file for all project secrets; uncommitted, gitignored) as the primary management point. This file contains all secrets for the entire monorepo, with nesting via prefixed sections for apps (e.g., APP_ADMIN_LATITUDE_API_KEY for webapp-admin).
  - Committed template: `.env.root.example` with placeholders.
  - Structure: UPPER_SNAKE_CASE with app prefixes (e.g., `APP_WEBAPP_ADMIN_DB_URL`, `APP_PROMPT_LAB_ADAPTER_MIRO_KEY`).
  - Loading: Loaded first at root; overrides propagate to apps via process.env or custom loader.
  - Example:
    ```
    # .env.root.local (central management)
    # Shared
    DB_SUPABASE_URL=postgresql://user:pass@localhost:5432/db
    REDIS_URL=redis://localhost:6379

    # Nested for Apps
    APP_WEBAPP_ADMIN_JWT_SECRET=admin_secret
    APP_WEBAPP_ADMIN_LATITUDE_API_KEY=admin_latitude_key
    APP_WEBAPP_USER_API_URL=user_api_url
    APP_PROMPT_LAB_AIRTABLE_BASE_ID=lab_airtable_id
    APP_PLAYGROUND_MOCK_SECRETS=mock_values
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```

- **Per-App**: `{app}/.env.local` (optional overrides for app-specific; loads after root). Use for local tweaks without changing root.
  - Template: `{app}/.env.local.example`.
  - Nesting: App files can override root (e.g., local dev keys); but prefer root for consistency.
  - Propagation: Apps inherit from root via shared process.env; use a loader script to inject nested vars.

- **Branch Overrides**: For branches like `playground`, load branch-specific via command (e.g., `pnpm manage-secrets --branch=playground`).

- **Loading**: Custom script (below) or dotenv; root loaded globally, apps append.

## Central Command for Secrets Storage and Retrieval

To manage secrets centrally across nested apps, implement a Node.js script `scripts/manage-secrets.mjs` for storage/retrieval, validation, and nesting.

- **Purpose**: Single command to set/retrieve/update secrets in .env.root.local, with app-specific nesting. Integrates with Vault for prod; local file for dev.
- **Usage Examples**:
  - `node scripts/manage-secrets.mjs set --app=webapp-admin --key=LATITUDE_API_KEY --value=sk-123` (adds APP_WEBAPP_ADMIN_LATITUDE_API_KEY).
  - `node scripts/manage-secrets.mjs get --app=prompt-lab --key=AIRTABLE_BASE_ID` (retrieves nested value).
  - `node scripts/manage-secrets.mjs validate` (checks all vars with Zod schema).
  - `node scripts/manage-secrets.mjs load --branch=playground` (loads overrides for branch).
  - Prod: `node scripts/manage-secrets.mjs fetch --from=vault --path=secret/howai/root` (pulls from Vault).

- **Implementation Outline** (`scripts/manage-secrets.mjs`):
  ```javascript
  import { readFileSync, writeFileSync } from 'fs';
  import { parse, stringify } from 'dotenv';
  import { z } from 'zod';
  import { execSync } from 'child_process';

  const envSchema = z.object({
    // Nested schemas for apps
    APP_WEBAPP_ADMIN_LATITUDE_API_KEY: z.string().min(1),
    // ...
  });

  const ROOT_ENV = '.env.root.local';

  function loadRoot() {
    return parse(readFileSync(ROOT_ENV, 'utf8'));
  }

  function saveRoot(env) {
    writeFileSync(ROOT_ENV, stringify(env));
  }

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'set':
      const app = args[1];
      const key = args[3];
      const value = args[5];
      const env = loadRoot();
      env[`APP_${app.toUpperCase()}_${key}`] = value;
      saveRoot(env);
      console.log(`Set ${key} for ${app}`);
      break;
    case 'get':
      // Similar, retrieve and log
      break;
    case 'validate':
      const env = loadRoot();
      envSchema.parse(env);  // Throws if invalid
      console.log('All secrets valid');
      break;
    case 'load':
      // Load from Vault or branch file
      if (args[1] === '--from=vault') {
        // Exec vault CLI or API call
        execSync('vault kv get -format=json secret/howai/root | jq -r > .env.root.local');
      }
      break;
    default:
      console.log('Commands: set, get, validate, load');
  }
  ```

- **Integration**: Call in dev scripts (e.g., `pnpm predev: "node scripts/manage-secrets.mjs validate"`); CI fetches from Vault.
- **Security**: Script runs locally or in CI with limited perms; no plain-text logs.

## 2. Secrets Management in CI/CD and Prod

- **GitHub Secrets**: For CI/CD (infra/github/workflows/); inject as env vars in actions (e.g., `env: ADAPTER_AIRTABLE_KEY: ${{ secrets.AIRTABLE_KEY }}`).
  - Per-Environment: Separate secrets for dev/staging/prod (e.g., `AIRTABLE_KEY_PROD`).
  - Access: Scoped to repo; rotate quarterly. Use manage-secrets to sync from root.

- **HashiCorp Vault**: For prod (recommended for scale); integrate via OIDC with GitHub Actions.
  - Paths: `secret/howai/root` for central, `secret/howai/{app}/{env}` for nested.
  - Fetch: Use `hashicorp/vault-action` in workflows: `uses: hashicorp/vault-action@v2` with role, path; output to env for apps.
  - Policies: Least-privilege (read-only for CI, TTL 1h). Central root path for all apps.

- **Overrides by Environment**:
  - **Local/Dev**: .env.root.local (central, with nesting); manage-secrets for updates.
  - **Staging/Preview**: GitHub Secrets with test keys; manage-secrets fetch in CI.
  - **Prod**: Vault central fetch; nest for apps in deployment (e.g., Kubernetes Secrets from root).
  - Branch-Specific: `playground` uses mock central secrets; `main` enforces prod root.

- **Deployment**: Vercel/Netlify env vars UI for simple apps (sync from root); Kubernetes Secrets for containerized (prompt-lab) with nested injection.

## 3. Runtime Validation and Handling

- **Validation Library**: Zod for schema-based parsing (from `packages/contracts/schemas/env.ts`).
  - Example:
    ```typescript
    // lib/env.ts
    import { z } from 'zod';
    import { LatitudeAdapter } from '@howaiconnects/adapters';

    const envSchema = z.object({
      ADAPTER_LATITUDE_API_KEY: z.string().min(1),
      DB_SUPABASE_URL: z.string().url(),
      // ...
    });

    const env = envSchema.parse(process.env);

    // Usage in adapter
    const adapter = new LatitudeAdapter({ apiKey: env.ADAPTER_LATITUDE_API_KEY });
    ```
  - Fail Fast: Throw on invalid (e.g., in server startup); log with Sentry.

- **Type Safety**: Infer types (`type Env = z.infer<typeof envSchema>`); use in tRPC procedures.

- **Fallbacks**: Defaults for non-critical (e.g., `cacheTtl: process.env.CACHE_TTL ? Number(env.CACHE_TTL) : 300`).

## 4. Security and Best Practices

- **Commit Rules**: Never commit .env.local; scan with git-secrets or pre-commit hooks.
  - Prohibited: Real keys in code; use placeholders.
- **Rotation**: Automate via Dependabot/Vault policies; notify on expiry.
- **Auditing**: Log access (Vault audit logs); monitor for leaks (GitHub secret scanning).
- **Multi-Env**: Use `NODE_ENV` (development/production); conditional loading (e.g., if prod, fetch from Vault).
- **Testing**: Mock env in tests (e.g., `vi.mock('process', 'env', { ADAPTER_LATITUDE_API_KEY: 'test' })`).

## 5. Implementation and Enforcement

- **Scripts**: `scripts/load-env.mjs` for custom loading (e.g., branch overrides).
- **CI Checks**: Action to validate .env.example completeness; fail if missing vars.
- **Onboarding**: README.md section: "Copy .env.example to .env.local and fill values."
- **Tools**: dotenv for loading; vault-cli for local Vault access.

This scheme balances convenience for dev with security for prod. Integrate with CI/CD; update via ADR for new tools (e.g., AWS Secrets Manager).