# Local Ports & Dev Process — HowAIConnects Zapier Integration

This document defines a simple, repeatable local port allocation and tracking strategy so running the web app, admin app, and integration tests won't conflict.

Recommended port assignments
- WEB (Next.js frontend / app): 3000
- ADMIN (webapp-admin): 3001
- API (Next.js API server if separate): 3002
- ZAPIER-INTEGRATION (local test base URL used for Zapier): 3003
- POSTGRES / SUPABASE emulators: 5432 (or Supabase defaults)
- OPTIONAL: Mock servers or test helpers: 4010+

Why fixed ports?
- Predictability when wiring environment variables (HOWAI_BASE_URL).
- Easier to script start/stop and record health checks.
- Avoid collisions with other dev processes by standardizing ports per project.

Port conflict checks (quick)
- macOS / Linux:
  - Check if port is in use:
    - lsof -i :3000
    - ss -ltn 'sport = :3000'
  - Kill the process (if it's a stray one you started):
    - kill -9 <pid>
- Windows (PowerShell):
  - netstat -ano | findstr :3000
  - taskkill /PID <pid> /F

Port lockfile (simple, manual)
- Create a small file in the integration folder that records the currently-reserved ports:
  integrations/zapier/howaiconnects-integration/PORTS.lock
- Format (simple YAML):
  web: 3000
  admin: 3001
  api: 3002
  zapier_test: 3003
  postgres: 5432
  notes: "Update this file if you change ports. Do NOT commit secrets."

Start commands (examples)
- Start main dev app (Next.js) on 3000:
  - HOWAI_PORT=3000 pnpm dev
  - or if Next supports env var: pnpm dev -- -p 3000
- Start admin app on 3001:
  - cd apps/webapp-admin && HOWAI_PORT=3001 pnpm dev
- Start a dedicated local integration tester (lightweight express proxy for Zapier testing) on 3003:
  - node integrations/zapier/howaiconnects-integration/local_test_server.js
  - The local_test_server can proxy requests to whichever running API port you choose; see sample script below.

Sample local_test_server.js (create in integration folder)
- Purpose: expose a stable HOWAI_BASE_URL on a dedicated port (3003) and forward to your API/backend.
- Example (node, plain):
  const http = require('http');
  const httpProxy = require('http-proxy');
  const proxy = httpProxy.createProxyServer({});
  const target = process.env.HOWAI_API_TARGET || 'http://localhost:3002';
  const port = process.env.HOWAI_PORT || 3003;
  const server = http.createServer((req, res) => {
    // add debug headers if needed
    proxy.web(req, res, { target }, (err) => {
      res.writeHead(502);
      res.end('proxy error: ' + err.message);
    });
  });
  server.listen(port, () => console.log(`Zapier test proxy listening on http://localhost:${port}, forwarding to ${target}`));

Using the ports for Zapier tests
- Set environment variables before running tests:
  export HOWAI_BASE_URL="http://localhost:3003"
  export HOWAI_SUPABASE_JWT="<paste-test-jwt>"
- Start your backend (API) on 3002 and the test proxy on 3003 so the Zapier integration points at 3003 and the API remains isolated.

Best practices
- Use the least-privileged JWT for tests (sign-in as test user).
- Don't commit tokens or secrets in repo files. Use a local .env (gitignored).
- Keep PORTS.lock in repo but update only when port allocations change (this helps team members pick free ports).
- For CI, use ephemeral ports and map them in pipeline environment vars instead of relying on PORTS.lock.

Next steps I can do for you
- Create the simple `local_test_server.js` proxy script in the integration folder and a `PORTS.lock` file (I can write these files now).
- Modify [`integrations/zapier/howaiconnects-integration/TESTING.md`](integrations/zapier/howaiconnects-integration/TESTING.md:1) to include these specific ports and exact commands.
- Or, if you prefer, I can run the auth test and `zapier validate` here once you start your local services and paste the test JWT.

Tell me which files above you want me to create/update now.