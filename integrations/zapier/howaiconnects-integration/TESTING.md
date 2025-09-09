# Testing & Validation — HowAIConnects Zapier Integration

This file describes the exact commands and environment variables to run local validation and tests for the Zapier Platform CLI integration.

Prerequisites
- Node.js (16+ recommended)
- npm or yarn
- Zapier Platform CLI installed globally:
  npm install -g zapier-platform-cli
- From the integration directory you may need to run npm install (or yarn) if package.json exists.

Working directory
- Change into the integration folder:
  cd integrations/zapier/howaiconnects-integration

Environment variables (for local testing)
- HOWAI_BASE_URL — Base URL of your running app (e.g., https://local.howaiconnects.test or https://app.example.com)
- HOWAI_SUPABASE_JWT — Supabase JWT to use as Bearer token for testing auth (use a scoped or short-lived token)

Example (macOS / Linux / WSL)
export HOWAI_BASE_URL="https://app.example.com"
export HOWAI_SUPABASE_JWT="eyJhbGciOiJI...example-jwt..."
# Optional: if Zapier CLI needs authentication, run `zapier login` first

Commands to run

1) Install dependencies (if package.json present)
npm install

2) Run the simple auth test script (validates JWT against /api/me, /api/health)
node auth.test.js
- Exit code 0 means auth validated.
- If it fails, verify HOWAI_BASE_URL and HOWAI_SUPABASE_JWT values and that the endpoint accepts Bearer token.

3) Validate integration with Zapier CLI
# Validate manifest and code
zapier validate

4) Run Zapier tests (if you add automated tests)
# Zapier test runner; depends on your test setup and test files
zapier test

5) Local debugging and manual test steps
- You can open Node REPL or run a quick script to exercise a specific action:
node -e "const z = require('./sample_bundle').buildAuthHeaders({authData:{supabase_jwt:process.env.HOWAI_SUPABASE_JWT}}); console.log(z)"

- Alternatively, create a quick Node script that imports an action file and calls its perform function using a minimal bundle shaped like Zapier's bundle (with authData and inputData).

Notes & Troubleshooting
- If `zapier validate` complains about missing required fields in authentication, ensure `authentication.js` exposes `supabase_jwt` as a required field or the test script uses the environment fallback HOWAI_SUPABASE_JWT.
- Zapier CLI sometimes requires a project manifest (package.json + index.js). Ensure `index.js` is present in the integration root and exports creates/triggers as shown in this repo.
- For CI: export HOWAI_BASE_URL and HOWAI_SUPABASE_JWT in the pipeline environment variables and run the same sequence: npm ci && node auth.test.js && zapier validate

Security recommendations
- Use a scoped or short-lived service JWT for Zapier rather than a long-lived or full-service role token.
- Rotate tokens regularly and limit scope where possible.

If you want, I can:
- Run the `zapier validate` and `node auth.test.js` commands here (I will execute them in the integration directory), or
- Produce example Node test scripts that call each action with sample input and print the response.

Choose which of the two you prefer next.