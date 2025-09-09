# Local Testing for HowAIConnects Zapier Integration

This file explains how to run the local test server and use the auth test helper for developing the Zapier integration.

Prerequisites
- Node.js installed (>=14)
- From the integration directory run: `npm install` (this will install express as a dev dependency)

Files of interest
- `local_test_server.js` — minimal Express server implementing:
  - GET /api/health
  - GET /api/auth/check (requires Authorization)
  - GET /api/me (requires Authorization)
  - GET / (root) lists routes
  - Configurable expected token via `EXPECT_JWT` env var (if unset, any Bearer token is accepted)
- `auth.test.js` — auth validation script used to verify HOWAI_BASE_URL + HOWAI_SUPABASE_JWT
  - Supports mock mode: `MOCK_AUTH=1` or `MOCK_AUTH=true`

Package helpers
- `package.json` in this directory includes helpful scripts:
  - `npm run start-local-server` — start the test server (runs `node local_test_server.js`)
  - `npm run test-auth-mock` — run auth test in mock mode (no network): `MOCK_AUTH=1 node auth.test.js`
  - `npm run test-auth-local` — run auth test in live mode against the configured HOWAI_BASE_URL
  - `npm run install-deps` — shortcut to install express if you prefer not to run `npm install`

Quickstart: run server and test auth locally
1. From the integration directory:
   - npm install
2. Start the local test server (default port 5173):
   - PORT=5173 EXPECT_JWT=ey... npm run start-local-server
   - If you don't want to require a specific token, omit EXPECT_JWT
3. In a separate terminal, run the auth test against the local server:
   - HOWAI_BASE_URL=http://localhost:5173 HOWAI_SUPABASE_JWT=ey... npm run test-auth-local
   - Expected output on success:
     - "SUCCESS: Auth validated against /api/me (status 200)" (or /api/auth/check or /api/health depending on response order)
4. To run the auth test without any network calls (CI-friendly):
   - npm run test-auth-mock
   - Expected output: "MOCK_AUTH enabled — skipping network validation and returning success."

Example Zapier CLI usage for local development
- Point Zapier CLI at the local server by setting HOWAI_BASE_URL:
  - HOWAI_BASE_URL=http://localhost:5173 HOWAI_SUPABASE_JWT=ey... zapier test
  - Or for validating auth flows in Zapier platform config, use the same env vars.

Notes and best practices
- The local test server is intended only for development/CI. Do not expose it publicly.
- Use EXPECT_JWT to enforce a specific token during testing; otherwise any Bearer token will pass.
- MOCK_AUTH is useful for CI pipelines where you want to validate bundle configuration without storing secrets.
- If you prefer a dependency-free server, ask and I can add a lightweight plain-Node HTTP version.

If you'd like, I can also:
- Add the above quickstart to the main integration README,
- Add a GitHub Actions CI workflow example that uses `npm run test-auth-mock`,
- Or run through adding the remaining Zapier actions/triggers next.
