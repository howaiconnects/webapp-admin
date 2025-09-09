Local dev proxy for subdomain routing (app.localhost.com)

Purpose
- Provide a small Node reverse-proxy to map a subdomain (app.localhost.com) to the webapp-admin dev server while keeping the marketing/landing site on the root hostname.
- Mirrors host-based routing behavior you'd use in production (Vercel) and preserves streaming/chunked responses.

Files added
- scripts/local-proxy.mjs — Node reverse-proxy using http-proxy.

Defaults and assumptions
- Proxy listens on: http://localhost:3000
- Marketing (landing) dev server upstream: http://localhost:3000
- Admin/webapp dev server upstream: http://localhost:3001
- Subdomain used for admin: app.localhost.com

If your dev servers use different ports, set environment variables when running the proxy:
- MARKETING_UPSTREAM — e.g. http://localhost:3000
- ADMIN_UPSTREAM — e.g. http://localhost:3001
- PROXY_PORT — port for the proxy to listen on (default 3000)
- APP_HOSTNAME — hostname to match for admin routing (default app.localhost.com)

Step-by-step (quick)
1) Add a hosts entry for the subdomain (requires admin privileges)
   - On macOS / Linux / WSL / most Unix:
     sudo -- sh -c 'echo "127.0.0.1 app.localhost.com" >> /etc/hosts'
   - On Windows (edit C:\Windows\System32\drivers\etc\hosts with Notepad as admin):
     127.0.0.1 app.localhost.com

2) Start the marketing (landing) dev server (if separate):
   - Example (root marketing app listening on 3000):
     pnpm --filter @howaiconnects/unified-webapp dev
     (Or whatever script starts your marketing site; ensure it listens on a different port than the proxy if needed, or use ADMIN_UPSTREAM to point elsewhere.)

3) Start the admin/webapp dev server on port 3001:
   - Example:
     cd apps/webapp-admin
     pnpm dev
     (If it binds to 3000 by default, run it on 3001 by setting env/args depending on framework. For Next.js, you can set PORT=3001: PORT=3001 pnpm dev)

4) Run the proxy (from repo root):
   - Simple:
     node scripts/local-proxy.mjs
   - With explicit upstreams:
     MARKETING_UPSTREAM=http://localhost:3000 ADMIN_UPSTREAM=http://localhost:3001 node scripts/local-proxy.mjs
   - Or use the repo script:
     pnpm run dev:proxy

5) Open the site:
   - Marketing/landing: http://localhost:3000
   - Admin UI: http://app.localhost.com:3000

Notes and troubleshooting
- If the admin app is already running on port 3000, start it on 3001 (PORT=3001 pnpm dev) or change ADMIN_UPSTREAM to match the port it's using.
- The proxy preserves streaming and chunked responses; streaming API routes should continue to work.
- If you prefer a single command to launch everything, install concurrently and run:
  pnpm add -D concurrently
  Then from the repo root:
  pnpm run dev:all-local
  (dev:all-local was added to package.json but requires concurrently to be installed to work.)
- If you see certificate/HTTPS issues, remember this proxy is HTTP-only and intended for local development. For HTTPS, consider mkcert + configuring the proxy for TLS or use a local reverse proxy like Traefik or nginx.

Security reminder
- Do not commit hosts file changes. The hosts file edit is local to your machine only.
- The proxy adds a simple x-local-proxy header. Do not rely on it in production.

Contact
- If you want, I can:
  - Add concurrently to devDependencies and enable the "dev:all-local" script out-of-the-box.
  - Provide exact commands to restart webapp-admin on port 3001 if it's currently running on 3000.
  - Switch the proxy to use a tiny Express-based implementation if you prefer middleware hooks.