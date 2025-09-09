# Zapier CLI integration scaffold

This directory holds notes and a starter scaffold plan for creating a Zapier Platform CLI integration for this project.

Goal
- Create a Zapier CLI integration that exposes:
  - Actions: Create Prompt (POST /api/prompt), Create User (POST /api/signup)
  - Triggers: New Prompt Log, New User (via Supabase webhooks or polling)
  - Auth: Supabase JWT passed as Authorization: Bearer <token> (treated as an API key in Zapier)

Prerequisites
- Install Zapier Platform CLI: npm install -g zapier-platform-cli
- Authenticate: zapier login
- You'll need a Zapier developer account to create and publish the app.

Recommended workflow (Zapier CLI)
1. Create a new integration project
   - cd to repo root
   - zapier init howaiconnects-integration
   - Choose node or typescript template (I recommend node for quick start or typescript for strong types)

2. Update package.json scripts inside the created integration:
   - "test": "zapier test"
   - "push": "zapier push"
   - "validate": "zapier validate"

3. Implement auth
   - Use API key style in Zapier, name it supabase_jwt.
   - Zapier will send the key in an input label; the integration should send Authorization header:
     Authorization: Bearer {{bundle.authData.supabase_jwt}}
   - In authentication.js (or authentication.ts) implement test method that calls:
     GET /api/me or any lightweight endpoint you create to validate token.
   - If you prefer, provide instructions to use the Supabase service role key for admin-level operations.

4. Implement Actions (examples)
   - creates/create_prompt.js
     - perform: POST to https://<your-app>/api/prompt
     - send JSON body: { message, history }
     - headers: Authorization: Bearer {{bundle.authData.supabase_jwt}}
     - sample output: { reply: ... }
   - creates/create_user.js
     - perform: POST to https://<your-app>/api/signup
     - body: { email, password, full_name }

5. Implement Triggers
   Option A: Webhooks via Supabase Realtime or HTTP webhooks
     - Create a server endpoint /api/zapier/webhook that accepts Supabase event payloads and forwards to Zapier
     - Or, configure Supabase to POST to Zapier's catch hook (Zapier can host webhook endpoints).
   Option B: Polling trigger
     - triggers/new_prompt_log.js
       - perform: GET https://<your-app>/api/prompt_logs?since={{bundle.meta.last_poll}}
       - return array of new log items
     - Use store to persist last poll timestamp in Zapier

6. Testing & validation
   - Use zapier test to run unit tests and validate
   - Use zapier validate to check the manifest
   - Use zapier push to push to dev environment and run live tests

7. Example file structure (inside howaiconnects-integration)
   - package.json
   - index.js
   - authentication.js
   - creates/
     - create_prompt.js
     - create_user.js
   - triggers/
     - new_prompt_log.js
     - new_user.js
   - searches/ (optional)
   - README.md

8. Helpful notes specific to this repo
   - Auth in this repo uses Supabase JWT tokens passed in Authorization header; the API routes (for example [`apps/webapp-admin/pages/api/prompt.ts:64`](apps/webapp-admin/pages/api/prompt.ts:64)) accept Bearer tokens and attempt server-side validation if SUPABASE_SERVICE_ROLE_KEY is available.
   - For actions that create users, the signup flow uses a server-side API that persists session cookies. When calling from Zapier you will not use cookies; instead call the public signup endpoint or implement a specialized service endpoint that accepts service-level requests (using SUPABASE_SERVICE_ROLE_KEY) if you need to create users without user-interaction.
   - Prompt logging is performed by a helper (prompt-logger). Add a simple GET endpoint that returns recent prompt logs for polling triggers, or expose a webhook integration from Supabase to push events to Zapier.

9. Next steps I can implement (switch to Code mode)
   - Run `zapier init` scaffold and create the basic files
   - Implement `authentication.js` to add supabase_jwt handling and a test call
   - Implement `creates/create_prompt.js` and `triggers/new_prompt_log.js` stubs pointing at this app
   - Add README examples and sample curl commands for testing

If you want, I can now scaffold the Zapier project files (index, authentication, one create, one trigger) under `integrations/zapier/howaiconnects-integration/` and wire them to call your app endpoints. Confirm and I will create the initial files.