# webapp-admin — Dev Notes and Quick Runbook

Purpose: concise runbook for starting webapp-admin locally, required env var names, common commands, and curl examples for testing the Airtable proxy. Refer to the full architecture overview at [`docs/architecture-overview.md`](docs/architecture-overview.md:1) for more context.

Important file references
- Server-side Airtable proxy: [`apps/webapp-admin/app/api/airtable/route.ts`](apps/webapp-admin/app/api/airtable/route.ts:1)
- Client Airtable consumer: [`apps/webapp-admin/src/components/AirtableTable.tsx`](apps/webapp-admin/src/components/AirtableTable.tsx:1)
- Local proxy script: [`scripts/local-proxy.mjs`](scripts/local-proxy.mjs:1)
- Dev orchestration: [`scripts/dev-all.mjs`](scripts/dev-all.mjs:1)

Quick commands
- Install deps (from repo root)
  - pnpm install
- Start only webapp-admin
  - cd apps/webapp-admin && pnpm dev
- Start unified-webapp (optional, separate terminal)
  - cd apps/unified-webapp && pnpm dev
- Start local reverse proxy (optional)
  - node scripts/local-proxy.mjs
- Start all dev services (optional)
  - node scripts/dev-all.mjs

Environment variable names (list only; do not add values)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- AIRTABLE_API_KEY
- AIRTABLE_BASE_ID
- AIRTABLE_TABLE_NAME
- LATITUDE_API_KEY
- MIRO_CLIENT_ID
- MIRO_CLIENT_SECRET
- VECTOR_DB_URL
- VECTOR_DB_API_KEY
- SESSION_COOKIE_NAME
- NEXTAUTH_URL
- VERCEL_PROJECT_ENV

Notes on env var usage
- Place server-only secrets (SUPABASE_SERVICE_ROLE_KEY, AIRTABLE_API_KEY, MIRO_CLIENT_SECRET, LATITUDE_API_KEY, VECTOR_DB_API_KEY, DATABASE_URL) in the environment used to start the Next.js server. They must never be exposed to client bundles.
- Public-safe vars (NEXT_PUBLIC_*) are read by client code and are intentionally public values.

Testing the Airtable proxy endpoint
- Server route location: [`apps/webapp-admin/app/api/airtable/route.ts`](apps/webapp-admin/app/api/airtable/route.ts:1)
- Typical dev path: http://localhost:3000/api/airtable

1) Quick browser test
- Start the app and authenticate via Supabase in the browser.
- Visit the admin page that includes the Airtable widget (component at [`apps/webapp-admin/src/components/AirtableTable.tsx`](apps/webapp-admin/src/components/AirtableTable.tsx:1)).
- Network requests to /api/airtable should be same-origin and include cookies.

2) curl test (requires authenticated Supabase session cookie)
- First, obtain a Supabase session cookie by authenticating in the browser and copying the cookie header for your session (or by using an API test user).
- Example curl including a cookie header (replace SESSION_COOKIE_VALUE with the real cookie value):
  - curl -v -H "Cookie: supabase-auth-token=SESSION_COOKIE_VALUE" http://localhost:3000/api/airtable
- If the project uses a different cookie name, replace the header key accordingly (see SESSION_COOKIE_NAME env var).

3) curl test using Authorization header (alternative)
- If the server route accepts an Authorization header with a Bearer token (check implementation), use:
  - curl -v -H "Authorization: Bearer SUPABASE_ACCESS_TOKEN" http://localhost:3000/api/airtable

Interpreting responses
- 200 OK — proxy returned Airtable data (success)
- 401/403 — authentication or authorization failed; ensure Supabase session cookie or Authorization header is present and server has required service keys
- 5xx — server side error; check server logs where pnpm dev is running

Checklist to verify local run
- [ ] pnpm dev in apps/webapp-admin starts without missing env var errors
- [ ] http://localhost:3000 loads the admin UI
- [ ] Supabase login works and a session cookie is set in the browser
- [ ] /api/airtable returns a proxied response when called from browser
- [ ] No client-side bundles include AIRTABLE_API_KEY or other server-only secrets

Troubleshooting tips
- Missing env errors: ensure env vars are present in the shell where you run pnpm dev or in a .env.local consumed by Next.js.
- Host-based routing: if using the local proxy and hostnames, add entries to /etc/hosts and ensure `scripts/local-proxy.mjs` is running.
- If /api/airtable returns auth errors, confirm the server has SUPABASE_SERVICE_ROLE_KEY (if the route needs it) and that the incoming request is authenticated.

Security reminder
- Do not place AIRTABLE_API_KEY or SUPABASE_SERVICE_ROLE_KEY into any file under `apps/webapp-admin/src` or other client-shipped code.
- Use server API routes for any third-party calls that require secrets.

Reference: broader architecture overview
- Full developer guide and architecture context: [`docs/architecture-overview.md`](docs/architecture-overview.md:1)