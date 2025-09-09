// local_test_server.js
// Small Express server to aid local Zapier CLI testing.
//
// Features:
// - Endpoints: GET /api/me, GET /api/health, GET /api/auth/check
// - Validates Authorization: Bearer <token>
// - Configurable expected token via EXPECT_JWT env var. If not set, any Bearer token is accepted.
// - Useful when running `zapier test` or `zapier validate` locally against HOWAI_BASE_URL=http://localhost:PORT
//
// Usage:
//   EXPECT_JWT=ey... node local_test_server.js
//   PORT=5173 node local_test_server.js
//
// Notes:
// - This server is intentionally minimal and only intended for local development/CI.
// - Do NOT use in production.

const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
const EXPECT_JWT = process.env.EXPECT_JWT || null;

// Helper to extract Bearer token
function extractBearer(req) {
  const h = req.get('Authorization') || req.get('authorization') || '';
  const parts = h.split(/\s+/);
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

// Common auth check middleware
function requireAuth(req, res, next) {
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ ok: false, error: 'missing_authorization', message: 'Authorization: Bearer <token> header required' });
  }
  if (EXPECT_JWT && token !== EXPECT_JWT) {
    return res.status(403).json({ ok: false, error: 'invalid_token', message: 'Provided token does not match EXPECT_JWT' });
  }
  // attach token for handlers if they want to echo it
  req.authToken = token;
  return next();
}

// /api/health - simple up-check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), now: new Date().toISOString() });
});

// /api/auth/check - checks for valid Authorization header and returns a minimal validation response
app.get('/api/auth/check', requireAuth, (req, res) => {
  res.json({
    ok: true,
    message: 'auth check ok',
    token_present: !!req.authToken,
    token_preview: req.authToken ? `${req.authToken.slice(0, 8)}...${req.authToken.slice(-8)}` : null,
  });
});

// /api/me - returns a fake user profile (non-privileged)
app.get('/api/me', requireAuth, (req, res) => {
  // Simulate a user object extracted from the JWT for Zapier to read
  res.json({
    id: 'local-test-user',
    email: 'local@example.com',
    name: 'Local Test User',
    provider: 'howaiconnects-local',
    token_preview: req.authToken ? `${req.authToken.slice(0, 8)}...${req.authToken.slice(-8)}` : null,
  });
});

// Root route to help discover endpoints
app.get('/', (req, res) => {
  res.json({
    ok: true,
    routes: ['/api/health', '/api/auth/check', '/api/me'],
    note: 'Use EXPECT_JWT env to require a specific token; otherwise any Bearer token is accepted.',
  });
});

app.listen(PORT, () => {
  console.log(`local_test_server listening on http://localhost:${PORT}`);
  if (EXPECT_JWT) {
    console.log('EXPECT_JWT is set — server will require that exact token for auth checks.');
  } else {
    console.log('No EXPECT_JWT set — any Bearer token will be accepted for auth checks.');
  }
});