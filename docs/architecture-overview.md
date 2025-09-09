# Architecture and Local Development Overview

This document explains the architecture, runtime model and developer workflow for running the repository locally with a focus on running the webapp-admin dashboard as the primary app on localhost:3000. It includes required services, environment variable guidance, reverse proxy usage, and a short verification checklist.

Important file references
- Server-side Airtable proxy route: [`apps/webapp-admin/app/api/airtable/route.ts`](apps/webapp-admin/app/api/airtable/route.ts:1)
- Client Airtable component (uses the server proxy): [`apps/webapp-admin/src/components/AirtableTable.tsx`](apps/webapp-admin/src/components/AirtableTable.tsx:1)
- Local reverse proxy script: [`scripts/local-proxy.mjs`](scripts/local-proxy.mjs:1)
- Dev orchestration script: [`scripts/dev-all.mjs`](scripts/dev-all.mjs:1)

Short project summary
- This repository is a Next.js monorepo containing at least two main apps:
  - webapp-admin — Admin dashboard and management UI (primary dev target)
  - unified-webapp — Customer or public-facing UI (optional to run concurrently)
- Adapter packages provide upstream integrations (Airtable, Latitude, Miro) and are located under `packages/adapters`.
- Authentication helpers and Supabase helpers are in `packages/auth`.
- Local dev tooling includes `scripts/local-proxy.mjs` (reverse-proxy) and `scripts/dev-all.mjs` (start all services locally).

Responsibilities of each app
- webapp-admin
  - Admin UI for platform operators
  - Contains server routes used as proxies to third-party services (see Airtable proxy)
  - Hosts server-side code that must not be bundled into client bundles
- unified-webapp
  - User-facing application
  - Shares components and packages via the monorepo
- packages/adapters
  - Adapter implementations for third-party services
  - Only server-side adapter code should hold secrets
- packages/auth
  - Supabase auth helpers and utilities for both client and server usage

Runtime model and where services run
- Browser (developer)
  - Connects to local webapp-admin (localhost:3000) during dev
  - May also connect to unified-webapp on its port when running concurrently
- webapp-admin (Next.js)
  - Runs on Node in dev (pnpm dev)
  - Handles server-side rendering, server API routes, and server-side proxies (e.g., Airtable)
  - Server-only secrets live on the server and must be referenced only in server runtime (process.env)
- unified-webapp (Next.js)
  - Runs separately and can be host-routed by the dev proxy (optional)
- Supabase (auth + Postgres)
  - Can run as a remote hosted Supabase instance or locally using the Supabase emulator
  - Stores user sessions and application data
- Background sync jobs / edge functions
  - May be represented by serverless functions or scheduled jobs in deployment
  - In local dev, some jobs may be simulated or run via scripts
- Vector DB (if used)
  - External service (e.g., Pinecone, Milvus); in local dev this may be a hosted instance or mocked

Dev setup - step by step

Prerequisites
- Node 18+ and pnpm installed
- Git checkout of this repository at repository root
- Optional: Docker and docker-compose if you prefer to run Supabase locally
- Edit hosts file if using host-based routing (instructions below)

Required local services, ports, and environment variables
- Typical ports (defaults used by scripts)
  - webapp-admin (Next.js): localhost:3000
  - unified-webapp (Next.js): localhost:3001 (recommended when running together)
  - Local reverse-proxy (scripts/local-proxy.mjs): expects to bind to a local host name; see `docs/LOCAL_DEV_PROXY.md` for details
  - Supabase emulator / Postgres: default docker-compose ports if using docker-compose, or your remote Supabase instance endpoint
- Environment variable names (list only)
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
  - NEXTAUTH_URL (if applicable)
  - VERCEL_PROJECT_ENV (or other deployment env markers)
- Marking server-only secrets vs safe public vars
  - Server-only secrets (never expose to client): SUPABASE_SERVICE_ROLE_KEY, AIRTABLE_API_KEY, MIRO_CLIENT_SECRET, LATITUDE_API_KEY, VECTOR_DB_API_KEY, DATABASE_URL
  - Public-safe variables (can be used in the browser): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Supabase anon key is public but limited; service role keys are privileged and must be server-only

Setting up environment variables locally
- You will typically create local env files from repository templates:
  - .env.root.local.example and .env.example are provided as reference
- Place server-only keys into the environment that starts the Next.js server (pnpm dev). Server runtime reads process.env directly.
- Do not commit values; store secrets in your local OS environment or use a .env.local that is gitignored.

How to run webapp-admin locally
1. From repository root, open a terminal and run:
   - pnpm install (first time)
   - cd apps/webapp-admin
   - pnpm dev
2. By default this runs webapp-admin on localhost:3000
3. The server-side Airtable proxy route is at the API route path handled in [`apps/webapp-admin/app/api/airtable/route.ts`](apps/webapp-admin/app/api/airtable/route.ts:1). Client components should call a same-origin endpoint like /api/airtable rather than calling Airtable directly.

Running unified-webapp concurrently
- To run unified-webapp alongside webapp-admin:
  - Open another terminal:
    - cd apps/unified-webapp
    - pnpm dev
  - By default use port 3001 for unified-webapp (set PORT env if needed)
  - Host-based routing can be used to map admin.example.local -> webapp-admin and app.example.local -> unified-webapp via the local proxy

Using the local reverse-proxy and dev scripts
- Purpose
  - Many local integrations expect host-based routing or multiple virtual hosts. The included proxy script helps map local hostnames to app ports.
- Key scripts
  - [`scripts/local-proxy.mjs`](scripts/local-proxy.mjs:1) — start a small reverse proxy that routes hostnames to ports
  - [`scripts/dev-all.mjs`](scripts/dev-all.mjs:1) — orchestration script to run multiple dev services concurrently
- Typical usage
  - Run the proxy: node scripts/local-proxy.mjs
  - Orchestrate dev: node scripts/dev-all.mjs
- Hosts file edits
  - Add entries to /etc/hosts to point dev hostnames to 127.0.0.1, for example:
    - 127.0.0.1    admin.local.test
    - 127.0.0.1    app.local.test
  - The proxy maps hostnames admin.local.test -> localhost:3000 and app.local.test -> localhost:3001 (example mapping; adjust in `scripts/local-proxy.mjs` if different)
- Example proxy configuration (conceptual)
  - admin.local.test -> 127.0.0.1:3000
  - app.local.test -> 127.0.0.1:3001
- When using host-based routing be sure to set NEXT_PUBLIC_SUPABASE_URL and related callbacks appropriately to match your hostnames used during dev.

Supabase session and testing the Airtable API
- The added Airtable proxy at [`apps/webapp-admin/app/api/airtable/route.ts`](apps/webapp-admin/app/api/airtable/route.ts:1) expects requests from authenticated admin sessions (depending on implementation).
- Supabase authentication in dev:
  - You can use a remote Supabase project and authenticate in the browser; the Supabase client will store a session cookie or local storage token depending on flow.
  - When testing server-side API routes that require an authenticated Supabase session, the server expects the incoming request to carry the Supabase session cookie header (or authorization header) that it can use to verify the user.
- When issuing server-proxied requests from the browser the cookie is automatically sent by the browser if same-origin and cookie is correctly set (domain and path).
- For curl testing of API endpoints you must include the Supabase session cookie or authorization header; see `apps/webapp-admin/DEV_NOTES.md` for examples.

Security guidance and secrets handling
- Never import server-only adapter code into client components or pages that are shipped to browsers.
- Use Next.js server API routes (e.g., routes under app/api) to call third-party services from the server-side so secrets remain on the server.
- Example: the Airtable API key must only be read in server context (see [`apps/webapp-admin/app/api/airtable/route.ts`](apps/webapp-admin/app/api/airtable/route.ts:1)).
- Deployment secrets
  - In Vercel: configure environment variables in the project dashboard and mark secrets under Production/Staging/Preview environments appropriately
  - In GitHub Actions: store secrets in repository or organization Secrets and reference them during CI
- Do not leak secrets into client bundles via NEXT_PUBLIC_* variables; only use NEXT_PUBLIC_* for intentionally public values.

Checklist for verifying correctness after setup
- [ ] webapp-admin loads at http://localhost:3000 (or host you configured)
- [ ] Server-side routes respond: curl http://localhost:3000/api/airtable returns expected status (may require auth)
- [ ] Supabase auth flows: login completes and user session exists in the browser
- [ ] Airtable widget loads in admin dashboard without client-side secret exposure
- [ ] Unified-webapp loads if run concurrently on its port
- [ ] Reverse proxy (if used) routes hostnames to the correct local ports

Minimal manual smoke test (developer)
1. Start required services:
   - Start Supabase (local or remote)
   - Start webapp-admin: cd apps/webapp-admin && pnpm dev
   - (Optional) Start unified-webapp: cd apps/unified-webapp && pnpm dev
   - (Optional) Start local proxy: node scripts/local-proxy.mjs
2. Open your browser at http://localhost:3000
3. Sign in using Supabase auth (dev credentials or create a user)
4. In admin dashboard navigate to the Airtable widget page (component at [`apps/webapp-admin/src/components/AirtableTable.tsx`](apps/webapp-admin/src/components/AirtableTable.tsx:1))
5. Verify data loads; open DevTools Network tab and confirm no requests include server-only keys (search for AIRTABLE_API_KEY)
6. Test server API route directly:
   - Use curl with authentication cookie or Authorization header (see `apps/webapp-admin/DEV_NOTES.md` for sample curl)
   - Confirm /api/airtable responds with proxied Airtable response

Troubleshooting notes
- If /api/airtable returns 401 or 403, verify your Supabase session is attached to the request and the server environment contains SUPABASE_SERVICE_ROLE_KEY if needed by server verification logic.
- If the client shows missing environment variables, ensure you added NEXT_PUBLIC_ prefixed variables into the environment used to start the dev server.
- If host-based routing fails, confirm /etc/hosts entries and that the proxy script is running and bound to the expected ports.

References and further reading
- Local proxy and orchestration scripts:
  - [`scripts/local-proxy.mjs`](scripts/local-proxy.mjs:1)
  - [`scripts/dev-all.mjs`](scripts/dev-all.mjs:1)
- Server proxy implementation example:
  - [`apps/webapp-admin/app/api/airtable/route.ts`](apps/webapp-admin/app/api/airtable/route.ts:1)
- Client usage of server API:
  - [`apps/webapp-admin/src/components/AirtableTable.tsx`](apps/webapp-admin/src/components/AirtableTable.tsx:1)