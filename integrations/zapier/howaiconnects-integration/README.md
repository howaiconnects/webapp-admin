# HowAIConnects — Zapier Integration

Overview
This repository contains a Zapier Platform CLI integration scaffold for HowAIConnects. It provides actions and triggers to interact with the HowAIConnects backend (example: create users, create prompts, and poll prompt logs). The integration expects a Supabase-style JWT to be used as an API key for authenticated requests.

Quick start
1. Install Zapier Platform CLI and authenticate:
   npm install -g zapier-platform-cli
   zapier login

2. Set required environment variables for local testing:
   - HOWAI_BASE_URL: Base URL of your deployment (e.g. https://app.example.com)
   - HOWAI_SUPABASE_JWT: Supabase JWT used as Bearer token (recommended)

API Key authentication
- This integration uses API Key authentication (recommended) where users supply an API Key (for example a Supabase JWT or service API key) which is sent with every request.
- Recommended auth field name in Zapier: `api_key` (stored in bundle.authData.api_key). The integration also accepts HOWAI_SUPABASE_JWT as an environment variable for local testing.
- Input fields (add these in the Zapier Authentication tab as API Key fields):
  - API Key (key: `api_key`, type: password, required: true) — Short-lived Supabase JWT or API key used as Bearer token. Help text: "Short-lived Supabase JWT or API key used as Bearer token. See: https://your-app.example.com/docs/tokens"
  - API Base URL (key: `base_url`, type: string, required: true) — Example: https://app.example.com or http://localhost:3003
  - Organization ID (key: `organization_id`, type: string, required: false)
  - Service Access Scope (key: `service_scope`, type: string, required: false)
  - Preferred AI Model (key: `ai_model`, type: string, required: false)
  - AI Service Region (key: `ai_region`, type: string, required: false)
  - Webhook Security Token (key: `webhook_token`, type: password, required: false)

Build input form
- In Zapier Visual Builder, open Authentication → select "API key".
- Add the fields above in the order users expect (API Key first). Use `password` type for sensitive fields so Zapier censors them in logs.
- For each field, include clear Help Text and a link where users can find the value in your app.

Add a Test API Request
- Configure a safe test request (typically GET /api/me or GET /api/health) to validate the API Key.
- Example test in code mode (authentication test):
  url: '{{bundle.authData.base_url}}/api/health'
  method: 'GET'
  headers: {
    Authorization: 'Bearer {{bundle.authData.api_key}}'
  }
- Prefer sending the API Key in headers rather than query params for security.
- Zapier will automatically include API Key and other auth fields into request headers/params based on the Authentication settings; use "Show Options" to remove auto-injection where not needed.

Configure a Connection Label
- Use a readable connectionLabel (e.g., organization + base_url) so users can tell which account they connected.

Test your authentication locally
- To verify locally, set environment variables in your shell before running Zapier CLI:
  - HOWAI_BASE_URL: Base URL used in tests (e.g., http://localhost:3003)
  - HOWAI_SUPABASE_JWT: (optional) Supabase JWT used during local zapier test runs
- Run: zapier test or zapier validate from the integration directory.

Notes & best practices
- Input fields marked as `password` and all auth fields with sensitive data are censored in Zapier logs.
- Use short-lived tokens or least-privilege service keys for Zapier to reduce blast radius.
- Ensure your test endpoint returns friendly errors (e.g., { error: 'message' }) so Zapier surfaces clear messages.

Request Template & Default Headers
- The integration includes a Request Template so Zapier will automatically inject common auth and context fields into every request.
- Default HTTP headers that will be attached to requests (configured in [`authentication.js`](integrations/zapier/howaiconnects-integration/authentication.js:1)):
  - X-HowAI-Organization: {{bundle.authData.organization_id}}
  - X-HowAI-Service-Scope: {{bundle.authData.service_scope}}
  - X-HowAI-AI-Model: {{bundle.authData.ai_model}}
  - X-HowAI-AI-Region: {{bundle.authData.ai_region}}
  - Authorization: Bearer {{bundle.authData.api_key}}
- Default body fields that Zapier will include by default (also set in [`authentication.js`](integrations/zapier/howaiconnects-integration/authentication.js:1)):
  - organization_id
  - service_scope
  - ai_model
  - ai_region
  - webhook_token
- These templates make it easier to onboard users via Zapier's Request Template UI, and ensure consistent headers/body across actions/triggers.
- Actions/triggers can override headers/body per-request when necessary; the Request Template is merged with per-request values.

Files of interest
- [`index.js`](integrations/zapier/howaiconnects-integration/index.js:1) — integration entrypoint; wires creates/triggers.
- [`authentication.js`](integrations/zapier/howaiconnects-integration/authentication.js:1) — Zapier auth configuration (API key / bearer token handling).
- [`creates/create_user.js`](integrations/zapier/howaiconnects-integration/creates/create_user.js:1) — Action that POSTs to /api/signup.
- [`creates/create_prompt.js`](integrations/zapier/howaiconnects-integration/creates/create_prompt.js:1) — Action that POSTs to /api/prompt.
- [`triggers/new_prompt_log.js`](integrations/zapier/howaiconnects-integration/triggers/new_prompt_log.js:1) — Polling trigger for prompt logs.

Action usage examples
- Create User
  - Endpoint: POST /api/signup
  - Required input: email (password optional)
  - Example request headers:
    Authorization: Bearer <supabase_jwt>
    Content-Type: application/json

- Create Prompt
  - Endpoint: POST /api/prompt
  - Body and headers follow the same pattern as above.

Trigger behavior
- new_prompt_log is implemented as a polling trigger:
  - It queries GET /api/prompt_logs?since=ISO_TIMESTAMP
  - It should return an array of logs ordered ascending by created_at.
- If you prefer webhooks, implement a webhook endpoint on the app and update the trigger to use subscription methods.

Local validation & testing
- To validate the integration locally:
  1. Ensure HOWAI_BASE_URL and HOWAI_SUPABASE_JWT are set in your environment.
  2. Run: zapier test (or zapier validate) from the integration directory.
- A simple auth validator script is planned at:
  - [`integrations/zapier/howaiconnects-integration/auth.test.js`](integrations/zapier/howaiconnects-integration/auth.test.js:1) (not yet created — optional)

Best practices & recommendations
- Use a service role or short-lived JWT with limited scope for Zapier integration to reduce blast radius.
- Prefer non-privileged endpoints for auth checks (e.g., /api/me or /api/health) in auth tests.
- Provide clear error messages from API endpoints: { error: 'message' } or { message: '...' } so the Zapier action surfaces friendly errors.

Next steps
- Add auth.test.js and a sample_bundle.js demonstrating how to supply supabase_jwt in the Zapier bundle.
- Add JSON schema examples for action input/output to improve the Zapier UI.
- Implement additional actions (log prompt, update user) and webhook-based triggers for real-time events.
- Run `zapier validate` and `zapier push` when ready to publish a private integration.

Contact / Support
If you need the integration to support webhook subscriptions, streaming fallbacks, or to ship as a public integration, provide the required endpoints and I will adapt the trigger implementations accordingly.