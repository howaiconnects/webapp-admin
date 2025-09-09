Environment Variables & Secret Configuration

This document lists the environment variables required by the HowAIConnects Next.js admin app (apps/webapp-admin), explains their purpose, and provides guidance for storing and managing secrets for local development and production. It focuses on the recent PromptLab integration which uses the Latitude adapter and Supabase authentication. See also the app middleware that relies on Supabase helpers: [`apps/webapp-admin/middleware.ts`](apps/webapp-admin/middleware.ts:1).

1) Required environment variables
-------------------------------

- **NEXT_PUBLIC_SUPABASE_URL** — URL of your Supabase instance.
  - Purpose: Tells client and server where your Supabase project is located (e.g. https://your-project.supabase.co).
  - Exposure: Not secret; used by client-side code (hence NEXT_PUBLIC_ prefix). Still store in env files (do not hard-code).
  - Notes: Required for Supabase client initialization and for Supabase Auth Helpers used by the Next.js middleware.

- **NEXT_PUBLIC_SUPABASE_ANON_KEY** — Supabase anonymous/public key.
  - Purpose: Public key used by client-side code to authenticate anonymous client actions (used by Supabase JS client).
  - Exposure: Considered "public" in Supabase terminology, but treat it like a credential: do not commit it into source, and do not leak it in public logs.
  - Notes: Must be present for client-side auth and for pages relying on Supabase.

- **SUPABASE_SERVICE_ROLE_KEY** — Supabase service role key (server-side secret).
  - Purpose: Full-privilege service role key used server-side for verifying JWTs, performing admin DB operations, and any server-only Supabase operations.
  - Exposure: Secret — must only be available to server runtime (e.g., Vercel server environment variables, Next.js server runtime). NEVER expose this to the browser or commit it.
  - Notes: The API route `/api/prompt` uses server-side Supabase verification and may rely on this key.

- **LATITUDE_SECRET** — Latitude API key (server-side secret).
  - Purpose: Authenticates requests to Latitude's AI endpoints via the LatitudeAdapter (the PromptLab integration).
  - Exposure: Secret — server-side only. Do not commit or expose to the client.
  - Notes: Used by the server-side route [`apps/webapp-admin/pages/api/prompt.ts`](apps/webapp-admin/pages/api/prompt.ts:1) and by any server-side adapter code that sends requests to Latitude.

- **LATITUDE_HOST** — Base endpoint for Latitude API.
  - Purpose: The base URL used for calling Latitude (e.g., their documented production host). Keeps host configurable for testing, self-hosting, or region-specific endpoints.
  - Exposure: Not sensitive. Store in env so it can be changed without code edits.
  - Default: If the adapter or docs specify a default host (e.g., https://api.latitude.io), you can leave it unset to use the adapter’s default — but we recommend explicitly setting it.

Optional / Additional environment variables (if present in your setup)
- REDIS_URL, DATABASE_URL, or other infra-related secrets — if your project uses Redis, external DBs, or third-party services, treat these as secrets and store them server-side only.
- NEXTAUTH_URL or other third-party auth callback URLs — if used, document per-hosting provider requirements.
- Any other LATITUDE_ or SUPABASE_ prefixed variables used by custom code.

2) Secret storage & handling guidelines
-----------------------

Local development
- Use a .env file in your local development environment. For Next.js apps the common file is `apps/webapp-admin/.env.local`.
  - This file should contain your local credentials and should NOT be committed to git.
  - The repo typically includes an example file: [`apps/webapp-admin/.env.local.example`](apps/webapp-admin/.env.local.example:1) — copy it to .env.local and fill real values.
- Keep secrets out of code and out of client-side bundles. Any variable intended for client use must be prefixed NEXT_PUBLIC_. Everything else should remain server-only.
- Use tools like direnv, dotenv, or the IDE’s secret management to reduce accidental exposure while developing.

Production (hosting platforms such as Vercel)
- Set environment variables in the platform’s project settings (e.g., Vercel → Project Settings → Environment Variables).
  - Add keys and values exactly as named above.
  - Mark sensitive variables (SUPABASE_SERVICE_ROLE_KEY, LATITUDE_SECRET, DATABASE_URL, etc.) as protected/encrypted if the host supports it.
- Ensure NEXT_PUBLIC_* variables are set for production so the client-side code receives them.
- Ensure service-role and other server-only secrets are not set in client-accessible contexts (for example, do not place them into runtime config that will be serialized to the browser).
- If using other deployment targets (Netlify, AWS, Docker, Kubernetes), use the platform’s secret management or your secret store (e.g., AWS Secrets Manager, Kubernetes Secrets) and inject them only into the server runtime.

Supabase-specific notes
- Supabase provides its own secret storage for Edge Functions. For this Next.js application (apps/webapp-admin) we expect secrets to be injected by the hosting platform (e.g., Vercel).
- The SUPABASE_SERVICE_ROLE_KEY has full DB privileges — treat it like a root credential and restrict access to it.

General best practices
- Never commit .env.local or any file with real secrets into git. Use the provided pre-commit or repo hooks that block secret commits (the repo includes scripts like scripts/prevent-secret-commits.sh).
- Rotate keys if you believe they’ve been exposed.
- Use principle of least privilege: prefer scoped keys where available (e.g., limited API keys) instead of full-service keys.
- Log redaction: avoid logging full secret values; log only masked identifiers if you need to record which key was used.

3) Example .env template
------------------------
The following is a sample .env layout for local development. Replace placeholders with real values and keep this file secret.

[`apps/webapp-admin/.env.local.example`](apps/webapp-admin/.env.local.example:1)

# Example .env.local (DO NOT COMMIT — keep only locally)
# Replace placeholders with your real project values
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key               # public client key (do not commit)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key           # SECRET: server-side only!
LATITUDE_SECRET=your-latitude-api-key                     # SECRET: server-side only!
LATITUDE_HOST=https://api.latitude.io                     # Optional: override Latitude host if needed

4) Minimal checklist before deployment
----------------------
- [ ] Ensure apps/webapp-admin/.env.local is gitignored and not committed.
- [ ] Add SUPABASE_SERVICE_ROLE_KEY and LATITUDE_SECRET to production secret store (Vercel/host).
- [ ] Confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are present in production env for client-side auth.
- [ ] Verify server-only code (API routes and middleware) reads server secrets and never leaks them to client responses.
- [ ] Rotate or revoke any test keys used in public repositories.

Reference files
- Server-side prompt API that uses Latitude + Supabase: [`apps/webapp-admin/pages/api/prompt.ts`](apps/webapp-admin/pages/api/prompt.ts:1)
- Supabase auth middleware (relies on NEXT_PUBLIC_ vars and cookies): [`apps/webapp-admin/middleware.ts`](apps/webapp-admin/middleware.ts:1)
- Latitude adapter implementation: [`packages/adapters/latitude-adapter.ts`](packages/adapters/latitude-adapter.ts:1)

End of document.

Using a root .env.local file
---------------------------

- Yes — you can use a root-level `.env.local` (project root) instead of or in addition to `apps/webapp-admin/.env.local` depending on how you run the project.
  - If your development workflow sources environment variables from the repository root (for example, when running build/dev commands from the monorepo root or using scripts that load the root .env), placing shared variables in a root `.env.local` makes them available to all workspaces/apps.
  - If an app-specific file is preferred (to avoid leaking other apps' secrets or to keep concerns separated), use `apps/webapp-admin/.env.local` for values that are specific to the admin app.
- Recommended approach:
  - Put shared, non-sensitive configuration (or values used by multiple apps) in the root `.env.local`.
  - Put app-specific secrets (for example, `SUPABASE_SERVICE_ROLE_KEY`, `LATITUDE_SECRET`) in `apps/webapp-admin/.env.local` to limit blast radius and reduce accidental exposure.
- Ensure whichever `.env.local` file you use is listed in `.gitignore` and never committed. The repo contains example env files (for instance [`apps/webapp-admin/.env.local.example`](apps/webapp-admin/.env.local.example:1)) to document expected variables without exposing secrets.

Using the Latitude Cloud API key (cloud vs self-hosted)
------------------------------------------------------

- Short summary:
  - For short-term/cloud usage, set LATITUDE_SECRET to your Latitude cloud API key and LATITUDE_HOST to the cloud API base URL. The adapter will use LATITUDE_SECRET as the server-side Authorization bearer token unless an authToken (Supabase JWT) is provided by the request.
  - For self-hosted deployments you may also need LATITUDE_DATABASE_URL and LATITUDE_REDIS_URL to run the full stack; these are not required for cloud usage.

- Recommended variables to set for cloud usage (server-only):
  - LATITUDE_HOST — Base URL for the cloud API (e.g., the hostname provided by Latitude cloud).
  - LATITUDE_SECRET — Your Latitude cloud API key (server-side only).

- Where to place these for local development:
  - Add them to `apps/webapp-admin/.env.local` (app-scoped) if you want them available only to the admin app.
  - Or add them to the root `.env.root.local` if your workflow loads env from the monorepo root. Prefer app-scoped files for secrets to reduce blast radius.

- What NOT to do:
  - Do not commit LATITUDE_SECRET to git or paste it into public chat. If exposed, rotate the key immediately in the Latitude dashboard.
  - Do not put LATITUDE_SECRET into client-accessible variables (no NEXT_PUBLIC_ prefix).

- Self-hosted notes (only if you deploy Latitude yourself):
  - Additional env vars you will likely need for a self-hosted Latitude deployment:
    - LATITUDE_DATABASE_URL — Postgres connection string for Latitude metadata/storage.
    - LATITUDE_REDIS_URL — Redis connection string for transient state and queues.
    - LATITUDE_SECRET — Admin/API secret for inter-service auth (same name used by adapter).
  - The repo contains a local compose sketch for self-hosting under `latitude-llm/` that lists these variables and service requirements.

- Example (do not commit real keys):
  - In `apps/webapp-admin/.env.local`:
    LATITUDE_HOST=https://api.latitude.cloud-host.example
    LATITUDE_SECRET=your-latitude-cloud-api-key

- Verification:
  - The adapter checks for LATITUDE_SECRET and LATITUDE_HOST in `packages/adapters/latitude-adapter.ts`. If LATITUDE_SECRET is unset or a placeholder, adapter.init() will throw an error (tests in `packages/adapters/__tests__` assert this behavior).
