#!/usr/bin/env node
// Simple dev orchestrator: spawn marketing, admin, and local-proxy processes
// Usage:
//   node scripts/dev-all.mjs
//
// Environment overrides:
//   MARKETING_CMD (default: "pnpm --filter @howaiconnects/webapp-admin dev --port 3000")
//   ADMIN_CMD (default: "pnpm --filter @howaiconnects/unified-webapp dev --port 3001")
//   PROXY_CMD (default: "node scripts/local-proxy.mjs")
// The script prints prefixed logs and will forward exit when any child exits with non-zero.

// NOTE: This file is ESM. It's intentionally minimal (no extra deps) so it works in most dev envs.

import { spawn } from 'child_process';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCmd(cmd) {
  // Split on spaces but keep simple: treat quoted segments
  // Minimal parser good enough for common use (no nested quotes)
  const re = /[^\s"]+|"([^"]*)"/g;
  const parts = [];
  let m;
  while ((m = re.exec(cmd)) !== null) {
    parts.push(m[1] ? m[1] : m[0]);
  }
  return parts;
}

function spawnProcess(name, cmd, env = {}) {
  const parts = parseCmd(cmd);
  const proc = spawn(parts[0], parts.slice(1), {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    shell: false,
  });

  const prefix = `[${name}]`;

  proc.stdout.on('data', (chunk) => {
    process.stdout.write(chunk.toString().split('\n').map((l, i, a) => (l || a.length - 1 !== i) ? `${prefix} ${l}\n` : '').join(''));
  });

  proc.stderr.on('data', (chunk) => {
    process.stderr.write(chunk.toString().split('\n').map((l, i, a) => (l || a.length - 1 !== i) ? `${prefix} ERR ${l}\n` : '').join(''));
  });

  proc.on('exit', (code, signal) => {
    if (signal) {
      console.log(`${prefix} exited with signal ${signal}`);
    } else {
      console.log(`${prefix} exited with code ${code}`);
    }
  });

  return proc;
}

function buildDefaultCmds() {
  // Default commands — keep aligned with package.json dev:apps expectations
  const MARKETING_CMD = process.env.MARKETING_CMD || 'pnpm --filter @howaiconnects/webapp-admin dev --port 3000';
  const ADMIN_CMD = process.env.ADMIN_CMD || 'pnpm --filter @howaiconnects/unified-webapp dev --port 3001';
  const PROXY_CMD = process.env.PROXY_CMD || `node ${path.join(__dirname, 'local-proxy.mjs')}`;
  return { MARKETING_CMD, ADMIN_CMD, PROXY_CMD };
}

function main() {
  console.log('');
  console.log('dev-all: starting dev orchestrator');
  console.log('cwd:', process.cwd());
  const { MARKETING_CMD, ADMIN_CMD, PROXY_CMD } = buildDefaultCmds();
  console.log('MARKETING_CMD=', MARKETING_CMD);
  console.log('ADMIN_CMD=', ADMIN_CMD);
  console.log('PROXY_CMD=', PROXY_CMD);
  console.log('');

  // Spawn processes
  const procs = [];
  procs.push(spawnProcess('marketing', MARKETING_CMD));
  procs.push(spawnProcess('admin', ADMIN_CMD));
  // Give apps a small head-start before starting proxy to reduce immediate proxy errors (optional)
  setTimeout(() => {
    procs.push(spawnProcess('proxy', PROXY_CMD, {
      PROXY_PORT: process.env.PROXY_PORT || '3000',
      MARKETING_UPSTREAM: process.env.MARKETING_UPSTREAM || 'http://localhost:3000',
      ADMIN_UPSTREAM: process.env.ADMIN_UPSTREAM || 'http://localhost:3001',
      APP_HOSTNAME: process.env.APP_HOSTNAME || 'app.localhost.com',
    }));
  }, 800);

  // Forward signals to children
  function forwardSignal(sig) {
    return () => {
      console.log(`dev-all: forwarding ${sig} to children`);
      for (const p of procs) {
        try {
          p.kill(sig);
        } catch (e) {
          // ignore
        }
      }
    };
  }

  process.on('SIGINT', forwardSignal('SIGINT'));
  process.on('SIGTERM', forwardSignal('SIGTERM'));

  // If any child exits with non-zero, exit with that code after killing others
  for (const p of procs) {
    p.on('exit', (code) => {
      if (code && code !== 0) {
        console.error(`dev-all: child exited with code ${code}, shutting down others`);
        for (const other of procs) {
          if (other !== p) {
            try { other.kill('SIGTERM'); } catch (e) {}
          }
        }
        // allow some time for graceful shutdown
        setTimeout(() => process.exit(code), 300);
      }
    });
  }

  // Keep process alive
}

main();