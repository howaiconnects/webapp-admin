#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from root .env.root.local
const rootEnvPath = path.resolve(__dirname, '..', '.env.root.local');
console.log('Loading root env from:', rootEnvPath);
if (fs.existsSync(rootEnvPath)) {
  const result = dotenv.config({ path: rootEnvPath });
  if (result.error) {
    console.error('Error loading .env.root.local:', result.error);
  } else {
    console.log('Root env loaded successfully. SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Undefined');
  }
} else {
  console.error('Root .env.root.local not found at:', rootEnvPath);
}

// Optional: Load app-specific .env.local if exists
const appEnvPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(appEnvPath)) {
  const result = dotenv.config({ path: appEnvPath });
  if (result.error) {
    console.error('Error loading app .env.local:', result.error);
  } else {
    console.log('App env loaded. SUPABASE_URL after app load:', process.env.SUPABASE_URL ? 'Set' : 'Undefined');
  }
}

// Run Next.js dev
const args = process.argv.slice(2);
console.log('Args received:', JSON.stringify(args));
const command = `next dev ${args.join(' ')}`;
console.log(`Running: ${command}`);

execSync(command, { stdio: 'inherit', cwd: process.cwd() });