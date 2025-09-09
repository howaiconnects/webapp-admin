#!/usr/bin/env node
/**
 * Enhanced Development Orchestration Script with Conda Environment Management
 * 
 * This script handles:
 * 1. Conda environment activation (for Python/AI dependencies)
 * 2. Docker infrastructure startup
 * 3. Database migrations
 * 4. Application server startup
 * 5. Graceful shutdown
 */

import 'dotenv-flow/config';
import { spawn, exec } from 'child_process';
import { argv, exit } from 'process';
import { setTimeout as wait } from 'timers/promises';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKING_DIR = process.cwd();

// Configuration
const CONDA_ENV_NAME = 'howaiconnects';
const CONDA_ENV_FILE = resolve(__dirname, '..', 'environment.yml');
const PYTHON_REQUIREMENTS = resolve(__dirname, '..', 'requirements.txt');

// Help text
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`Usage: node ./scripts/dev-all-with-conda.mjs [options]

Enhanced Development Orchestration with Conda Environment Management

Options:
  --help, -h           Show this help message
  --skip-conda         Skip Conda environment setup
  --skip-infra         Skip Docker infrastructure startup
  --skip-migrations    Skip database migrations
  --conda-env NAME     Use specific Conda environment (default: ${CONDA_ENV_NAME})

Workflow:
  1. Checks/creates Conda environment
  2. Activates Conda environment for Python dependencies
  3. Starts Docker infrastructure (PostgreSQL, Redis)
  4. Waits for services to be ready
  5. Runs database migrations
  6. Starts all application servers
  7. Provides graceful shutdown on SIGINT/SIGTERM

Environment Variables:
  SKIP_CONDA=true      Skip Conda setup (same as --skip-conda)
  CONDA_ENV_NAME       Override default Conda environment name
`);
  process.exit(0);
}

// Parse command line options
const skipConda = argv.includes('--skip-conda') || process.env.SKIP_CONDA === 'true';
const skipInfra = argv.includes('--skip-infra');
const skipMigrations = argv.includes('--skip-migrations');
const condaEnvOverride = argv.find(arg => arg.startsWith('--conda-env='));
const condaEnvName = condaEnvOverride 
  ? condaEnvOverride.split('=')[1] 
  : process.env.CONDA_ENV_NAME || CONDA_ENV_NAME;

// Utility functions
function spawnCmd(command, args = [], opts = {}) {
  const child = spawn(command, args, { stdio: 'inherit', shell: false, ...opts });
  return child;
}

function spawnShell(cmd, opts = {}) {
  const child = spawn(cmd, { stdio: 'inherit', shell: true, ...opts });
  return child;
}

function runCmdGetExit(command, args = [], opts = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const c = spawnCmd(command, args, opts);
    c.on('error', rejectRun);
    c.on('exit', (code, sig) => {
      if (code === 0) resolveRun(0);
      else rejectRun(new Error(`Process exited ${code ?? sig}`));
    });
  });
}

// Child process management
let children = [];
let shuttingDown = false;

function addChild(c) {
  if (!c) return;
  children.push(c);
  c.on('exit', () => {
    children = children.filter(x => x !== c);
  });
}

// Conda environment management
async function checkCondaInstalled() {
  try {
    await execAsync('conda --version');
    return true;
  } catch {
    return false;
  }
}

async function checkCondaEnvExists(envName) {
  try {
    const { stdout } = await execAsync('conda env list');
    return stdout.includes(envName);
  } catch {
    return false;
  }
}

async function createCondaEnv() {
  console.log(`→ Creating Conda environment: ${condaEnvName}`);
  
  if (existsSync(CONDA_ENV_FILE)) {
    // Create from environment.yml
    console.log(`  Using environment file: ${CONDA_ENV_FILE}`);
    await runCmdGetExit('conda', ['env', 'create', '-f', CONDA_ENV_FILE, '-n', condaEnvName]);
  } else {
    // Create basic environment with Python
    console.log('  Creating basic Python 3.11 environment');
    await runCmdGetExit('conda', ['create', '-n', condaEnvName, 'python=3.11', '-y']);
  }
  
  // Install additional requirements if they exist
  if (existsSync(PYTHON_REQUIREMENTS)) {
    console.log(`  Installing requirements from: ${PYTHON_REQUIREMENTS}`);
    const pipCmd = `conda run -n ${condaEnvName} pip install -r ${PYTHON_REQUIREMENTS}`;
    await runCmdGetExit('sh', ['-c', pipCmd]);
  }
}

async function setupCondaEnvironment() {
  if (skipConda) {
    console.log('→ Skipping Conda environment setup (--skip-conda flag set)');
    return;
  }

  console.log('→ Setting up Conda environment');
  
  // Check if Conda is installed
  if (!await checkCondaInstalled()) {
    console.warn('⚠️  Conda is not installed. Skipping Python environment setup.');
    console.warn('   Install Miniconda/Anaconda to enable Python dependencies.');
    return;
  }
  
  // Check if environment exists
  const envExists = await checkCondaEnvExists(condaEnvName);
  
  if (!envExists) {
    await createCondaEnv();
  } else {
    console.log(`  Environment '${condaEnvName}' already exists`);
    
    // Update environment if environment.yml has changed
    if (existsSync(CONDA_ENV_FILE)) {
      console.log('  Updating environment from environment.yml');
      await runCmdGetExit('conda', ['env', 'update', '-f', CONDA_ENV_FILE, '-n', condaEnvName]);
    }
  }
  
  console.log(`✓ Conda environment '${condaEnvName}' is ready`);
  
  // Export conda activation command for child processes
  process.env.CONDA_DEFAULT_ENV = condaEnvName;
  process.env.CONDA_PREFIX = `${process.env.HOME}/miniconda3/envs/${condaEnvName}`;
}

// Infrastructure management
async function startInfra() {
  if (skipInfra) {
    console.log('→ Skipping infrastructure startup (--skip-infra flag set)');
    return;
  }
  
  console.log('→ Starting infrastructure: pnpm run dev:infra');
  const child = spawnShell('pnpm run dev:infra', { cwd: WORKING_DIR });
  addChild(child);
  await wait(2000);
}

async function checkCommandExists(cmd) {
  try {
    await runCmdGetExit('which', [cmd]);
    return true;
  } catch {
    return false;
  }
}

async function checkPostgresWithPgIsReady(host = 'localhost', port = 5432) {
  try {
    await runCmdGetExit('pg_isready', ['-h', host, '-p', String(port)]);
    return true;
  } catch {
    return false;
  }
}

async function checkRedisWithCli(host = 'localhost', port = 6379) {
  try {
    await runCmdGetExit('redis-cli', ['-h', host, '-p', String(port), 'ping']);
    return true;
  } catch {
    return false;
  }
}

async function checkPostgresDocker(service = 'postgres') {
  try {
    await runCmdGetExit('docker-compose', ['-f', 'docker-compose.dev.yml', 'exec', '-T', service, 'pg_isready']);
    return true;
  } catch {
    return false;
  }
}

async function checkRedisDocker(service = 'redis') {
  try {
    await runCmdGetExit('docker-compose', ['-f', 'docker-compose.dev.yml', 'exec', '-T', service, 'redis-cli', 'ping']);
    return true;
  } catch {
    return false;
  }
}

async function waitForServices({ timeoutMs = 120_000, intervalMs = 3000 } = {}) {
  if (skipInfra) {
    console.log('→ Skipping service checks (infrastructure skipped)');
    return;
  }
  
  const start = Date.now();
  console.log('→ Waiting for PostgreSQL and Redis to become ready...');
  
  const tryOnce = async () => {
    let pgReady = false;
    let redisReady = false;
    
    if (await checkCommandExists('pg_isready')) {
      pgReady = await checkPostgresWithPgIsReady();
    } else {
      pgReady = await checkPostgresDocker('postgres').catch(() => false);
    }
    
    if (await checkCommandExists('redis-cli')) {
      redisReady = await checkRedisWithCli();
    } else {
      redisReady = await checkRedisDocker('redis').catch(() => false);
    }
    
    return { pgReady, redisReady };
  };
  
  while (Date.now() - start < timeoutMs) {
    const { pgReady, redisReady } = await tryOnce();
    console.log(`  • PostgreSQL: ${pgReady ? '✓ ready' : '⏳ not ready'} | Redis: ${redisReady ? '✓ ready' : '⏳ not ready'}`);
    if (pgReady && redisReady) return;
    await wait(intervalMs);
  }
  
  throw new Error('Timeout waiting for PostgreSQL and Redis to become ready');
}

async function runMigrations() {
  if (skipMigrations) {
    console.log('→ Skipping database migrations (--skip-migrations flag set)');
    return;
  }
  
  console.log('→ Running database migrations: pnpm run db:migrate:dev');
  const child = spawnShell('pnpm run db:migrate:dev', { cwd: WORKING_DIR });
  addChild(child);
  
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error('Database migration failed'));
    });
    child.on('error', reject);
  });
}

async function startApps() {
  console.log('→ Starting application development servers');
  
  // Define application commands with their environments
  const apps = [
    {
      name: 'webapp-admin',
      cmd: 'pnpm --filter @howaiconnects/webapp-admin dev',
      port: 3000,
      framework: 'Next.js'
    },
    {
      name: 'prompt-lab',
      cmd: 'pnpm --filter @howaiconnects/prompt-lab dev',
      port: 3002,
      framework: 'Vite (to be migrated)'
    },
    {
      name: 'unified-webapp',
      cmd: 'pnpm --filter @howaiconnects/unified-webapp dev',
      port: 5173,
      framework: 'Vite (to be migrated)'
    }
  ];
  
  // Start apps with concurrently
  const cmds = apps.map(app => app.cmd);
  const names = apps.map(app => app.name);
  const cmd = `npx concurrently --names "${names.join(',')}" --prefix-colors "bgBlue.bold,bgGreen.bold,bgMagenta.bold" --kill-others-on-fail "${cmds.join('" "')}"`;
  
  const child = spawnShell(cmd, { cwd: WORKING_DIR });
  addChild(child);
  
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`Application servers exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

function printBanner() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Development Environment Started Successfully!');
  console.log('='.repeat(60));
  console.log('\n📍 Application URLs:');
  console.log('  • Webapp Admin (Next.js):  http://localhost:3000');
  console.log('  • Prompt Lab (Vite):       http://localhost:3002');
  console.log('  • Unified Webapp (Vite):   http://localhost:5173');
  console.log('\n🗄️  Infrastructure:');
  console.log('  • PostgreSQL:              localhost:5432');
  console.log('  • Redis:                   localhost:6379');
  
  if (!skipConda) {
    console.log(`\n🐍 Python Environment:');
    console.log('  • Conda Environment:       ${condaEnvName}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Press Ctrl+C to stop all services and exit\n');
}

async function teardown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  
  console.log('\n→ Shutting down development environment...');
  
  // Kill all child processes
  for (const c of children.slice()) {
    try {
      c.kill && c.kill('SIGTERM');
    } catch (e) {
      // Ignore errors
    }
  }
  
  await wait(500);
  
  if (!skipInfra) {
    try {
      console.log('→ Stopping Docker containers...');
      await runCmdGetExit('docker-compose', ['-f', 'docker-compose.dev.yml', 'down', '--remove-orphans']);
    } catch (e) {
      console.error('Error stopping Docker containers:', e.message || e);
    }
  }
  
  console.log('✓ Shutdown complete');
  process.exit(exitCode);
}

function setupSignalHandlers() {
  const handle = async (sig) => {
    console.log(`\nReceived ${sig}`);
    await teardown(0);
  };
  
  process.on('SIGINT', handle);
  process.on('SIGTERM', handle);
  process.on('uncaughtException', async (err) => {
    console.error('Uncaught exception:', err);
    await teardown(1);
  });
  process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled rejection:', reason);
    await teardown(1);
  });
}

// Main orchestration
async function main() {
  setupSignalHandlers();
  
  try {
    // Step 1: Setup Python/Conda environment
    await setupCondaEnvironment();
    
    // Step 2: Start infrastructure
    await startInfra();
    
    // Step 3: Wait for services
    await waitForServices({ timeoutMs: 120_000, intervalMs: 3000 });
    
    // Step 4: Run migrations
    await runMigrations();
    
    // Step 5: Print banner
    printBanner();
    
    // Step 6: Start applications
    await startApps();
    
    // Keep process alive
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on('SIGINT', async () => {
      await teardown(0);
    });
    
  } catch (err) {
    console.error('❌ Error during development orchestration:', err && err.message ? err.message : err);
    await teardown(1);
  }
}

// Run the orchestration
main();