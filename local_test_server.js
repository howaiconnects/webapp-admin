/**
 * local_test_server.js
 *
 * Simple proxy server to assist Zapier CLI local testing.
 *
 * Usage:
 * 1. Install dependencies:
 *    npm install express http-proxy-middleware node-fetch
 *
 * 2. Set environment variables:
 *    - HOWAI_BASE_URL: the target base URL of your running app (e.g. http://localhost:3000)
 *    - ZAPIER_JWT: optional. If set, this token will be injected as Authorization: Bearer <token>.
 *      If not set, the proxy will attempt to fetch a short-lived token from
 *      `${HOWAI_BASE_URL}/api/zapier/token` (this requires the app to be running locally).
 *    - PORT: optional port for the proxy (default: 3001)
 *
 * 3. Start the proxy:
 *    node local_test_server.js
 *
 * 4. Configure Zapier CLI to use the proxy URL (e.g. http://localhost:3001) for testing webhooks/actions.
 */

const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const fetch = require('node-fetch')

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001
const TARGET = process.env.HOWAI_BASE_URL
if (!TARGET) {
  console.error('ERROR: HOWAI_BASE_URL must be set (e.g. http://localhost:3000)')
  process.exit(1)
}

const app = express()

// Helper: get a token to inject. Preference: ZAPIER_JWT env, otherwise call /api/zapier/token on target.
async function getToken() {
  if (process.env.ZAPIER_JWT) {
    return { token: process.env.ZAPIER_JWT, preview: false }
  }

  const tokenUrl = `${TARGET.replace(/\/$/, '')}/api/zapier/token`
  try {
    const res = await fetch(tokenUrl, { credentials: 'include' })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn('[local_test_server] Failed to fetch token from', tokenUrl, 'status=', res.status, 'body=', body)
      return null
    }
    const json = await res.json()
    return { token: json.token, preview: !!json.preview }
  } catch (e) {
    console.warn('[local_test_server] Error fetching token from', tokenUrl, e)
    return null
  }
}

// Attach middleware that injects Authorization header per-request (async)
app.use(async (req, res, next) => {
  // For health checks or local-only paths, pass through
  if (req.path === '/__local_proxy_health') {
    return next()
  }

  const tokenObj = await getToken()
  if (tokenObj && tokenObj.token) {
    // Store on req for downstream proxy to use
    req.headers['authorization'] = `Bearer ${tokenObj.token}`
    req.headers['x-zapier-proxy-preview'] = tokenObj.preview ? '1' : '0'
  } else {
    console.warn('[local_test_server] No Zapier token available; forwarding without Authorization header')
  }

  console.info(`[local_test_server] ${req.method} ${req.originalUrl} -> ${TARGET} (auth=${!!tokenObj?.token})`)
  return next()
})

// Proxy all other requests to the target
app.use(
  '/',
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    selfHandleResponse: false,
    onProxyReq: (proxyReq, req, res) => {
      // Copy any headers already on req (authorization injected earlier)
      if (req.headers['authorization']) {
        proxyReq.setHeader('authorization', req.headers['authorization'])
      }
    },
    logLevel: 'warn',
  })
)

// Simple health endpoint
app.get('/__local_proxy_health', (req, res) => {
  res.json({ ok: true, target: TARGET })
})

app.listen(PORT, () => {
  console.log(`[local_test_server] Proxy listening on http://localhost:${PORT} -> ${TARGET}`)
})