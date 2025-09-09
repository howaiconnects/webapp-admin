#!/usr/bin/env node
/**
 * Local reverse proxy for host-based routing during development.
 *
 * Usage:
 * 1. Ensure your hosts file maps app.localhost.com to 127.0.0.1:
 *    127.0.0.1 app.localhost.com
 *
 * 2. Start the marketing (landing) dev server and the admin dev server:
 *    - marketing (default): http://localhost:3000
 *    - webapp-admin (default): http://localhost:3001
 *
 * 3. Run this proxy:
 *    node scripts/local-proxy.mjs
 *
 * The proxy listens on :3000 and forwards requests based on the Host header:
 *  - Host 'app.localhost.com' -> webapp-admin upstream (default http://localhost:3001)
 *  - any other host -> marketing upstream (default http://localhost:3000)
 *
 * Environment variables:
 *  - PROXY_PORT (default 3000)
 *  - MARKETING_UPSTREAM (default http://localhost:3000)
 *  - ADMIN_UPSTREAM (default http://localhost:3001)
 *
 * The proxy preserves headers and supports streaming / chunked responses.
 */

import http from 'http';
import httpProxy from 'http-proxy';

const PROXY_PORT = Number(process.env.PROXY_PORT || 3000);
const MARKETING_UPSTREAM = process.env.MARKETING_UPSTREAM || 'http://localhost:3000';
const ADMIN_UPSTREAM = process.env.ADMIN_UPSTREAM || 'http://localhost:3001';
const APP_HOSTNAME = process.env.APP_HOSTNAME || 'app.localhost.com';

const proxy = httpProxy.createProxyServer({
  xfwd: true,
  preserveHeaderKeyCase: true,
  proxyTimeout: 2 * 60 * 1000, // 2 minutes
});

proxy.on('error', (err, req, res) => {
  console.error('[local-proxy] proxy error:', err && err.stack ? err.stack : err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
  }
  try {
    res.end('Bad Gateway (local proxy error)\n');
  } catch (e) {
    // ignore
  }
});

const server = http.createServer((req, res) => {
  const hostHeader = req.headers.host || '';
  const hostname = hostHeader.split(':')[0];

  const target = hostname === APP_HOSTNAME ? ADMIN_UPSTREAM : MARKETING_UPSTREAM;

  // Add a header so upstream knows it's proxied locally
  req.headers['x-forwarded-proto'] = 'http';
  req.headers['x-local-proxy'] = 'true';

  // Preserve streaming: forward request and pipe response as-is.
  proxy.web(req, res, { target, changeOrigin: true });
});

server.listen(PROXY_PORT, () => {
  console.log(`[local-proxy] listening on http://localhost:${PROXY_PORT}`);
  console.log(`[local-proxy] app host: ${APP_HOSTNAME} -> ${ADMIN_UPSTREAM}`);
  console.log(`[local-proxy] other hosts -> ${MARKETING_UPSTREAM}`);
  console.log('');
  console.log('Make sure your hosts file contains:');
  console.log('  127.0.0.1 app.localhost.com');
  console.log('');
  console.log('Then run your dev servers:');
  console.log('  MARKETING_UPSTREAM=http://localhost:3000 ADMIN_UPSTREAM=http://localhost:3001 node scripts/local-proxy.mjs');
});