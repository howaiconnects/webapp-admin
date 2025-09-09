// auth.test.js
// Simple integration test for Zapier auth flow using Supabase JWT.
// This script validates that a provided Supabase JWT (recommended as Zapier "API key")
// can access a non-privileged endpoint (e.g., GET /api/me or GET /api/health).
//
// Usage (locally / CI):
//   HOWAI_BASE_URL=https://your-app.example HOWAI_SUPABASE_JWT=ey... node auth.test.js
//   MOCK_AUTH=1 node auth.test.js   # runs in mock mode (bypasses network)
//
// Exit codes:
//   0 - success (auth validated or mock succeeded)
//   1 - failure (network / auth error / unexpected status)
//
// Behavior:
// - By default, ensure HOWAI_BASE_URL and HOWAI_SUPABASE_JWT are set.
// - If MOCK_AUTH=1 is set, the script will succeed without making network calls.
// - Try endpoints in order: /api/me, /api/health, /api/auth/check
// - Send Authorization: Bearer <jwt>
// - Expect a 2xx response. On success prints sample response and exits 0.
// - On failure prints helpful diagnostics and exits 1.
//

ntegrations/zapier/howaiconnects-integration/auth.test.js</path>
<content">// auth.test.js
// Simple integration test for Zapier auth flow using Supabase JWT.
// This script validates that a provided Supabase JWT (recommended as Zapier \"API key\")
// can access a non-privileged endpoint (e.g., GET /api/me or GET /api/health).
//
// Usage (locally / CI):
//   HOWAI_BASE_URL=https://your-app.example HOWAI_SUPABASE_JWT=ey... node auth.test.js
//
// Exit codes:
//   0 - success (auth validated)
//   1 - failure (network / auth error / unexpected status)
//
// Behavior:
// - Ensure HOWAI_BASE_URL and HOWAI_SUPABASE_JWT are set.
// - Try endpoints in order: /api/me, /api/health, /api/auth/check
// - Send Authorization: Bearer <jwt>
// - Expect a 2xx response. On success prints sample response and exits 0.
// - On failure prints helpful diagnostics and exits 1.

const https = require('https');
const http = require('http');
const urlLib = require('url');

const BASE = process.env.HOWAI_BASE_URL;
const JWT = process.env.HOWAI_SUPABASE_JWT || process.env.SUPABASE_JWT;
const MOCK = process.env.MOCK_AUTH === '1' || process.env.MOCK_AUTH === 'true';

// If mock mode is enabled, skip network calls and return success immediately.
if (MOCK) {
  console.log('MOCK_AUTH enabled — skipping network validation and returning success.');
  console.log('NOTE: This mode is only for local validation and CI where real tokens are unavailable.');
  process.exit(0);
}

if (!BASE) {
  console.error('ERROR: HOWAI_BASE_URL environment variable is required.');
  process.exit(1);
}
if (!JWT) {
  console.error('ERROR: HOWAI_SUPABASE_JWT (or SUPABASE_JWT) environment variable is required.');
  process.exit(1);
}

const endpoints = ['/api/me', '/api/health', '/api/auth/check'];

async function tryEndpoint(ep) {
  const full = BASE.replace(/\\/$/, '') + ep;
  const parsed = urlLib.parse(full);
  const httpLib = parsed.protocol === 'https:' ? https : http;

  const opts = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${JWT}`,
      'Accept': 'application/json',
      'User-Agent': 'howaiconnects-zapier-auth-test/1.0',
    },
  };

  return new Promise((resolve, reject) => {
    const req = httpLib.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        if (status >= 200 && status < 300) {
          console.log(`SUCCESS: Auth validated against ${ep} (status ${status})`);
          try {
            const json = JSON.parse(data || '{}');
            console.log('Response JSON sample:', JSON.stringify(json, null, 2));
          } catch (e) {
            console.log('Response was not JSON; raw body length:', (data || '').length);
          }
          resolve(true);
        } else if (status === 401 || status === 403) {
          reject(new Error(`Unauthorized (status ${status}) when calling ${ep}`));
        } else {
          reject(new Error(`Unexpected status ${status} when calling ${ep} — body: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

(async () => {
  for (const ep of endpoints) {
    try {
      const ok = await tryEndpoint(ep);
      if (ok) process.exit(0);
    } catch (err) {
      console.warn(`Attempt to ${ep} failed: ${err.message}`);
    }
  }

  console.error('ERROR: All endpoint attempts failed. Ensure HOWAI_SUPABASE_JWT is valid and HOWAI_BASE_URL is correct.');
  console.error('Tip: Use a short-lived or service JWT with limited privileges for Zapier.');
  process.exit(1);
})();