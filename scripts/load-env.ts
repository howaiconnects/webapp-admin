#!/usr/bin/env ts-node

import { config } from 'dotenv-flow';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Load environment variables from .env.root.local
 * This script is used to centralize environment variable loading across the monorepo
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

const result = config({
  // Always look for env files in the project root, regardless of where this script is run from
  path: join(__dirname, '..'),
  // Prioritize .env.root.local over other env files
  files: ['.env.root.local', '.env.local', '.env'],
  // Don't override existing env vars (respect CLI overrides)
  purge_dotenv: false,
});

console.log('✅ Environment variables loaded from .env.root.local');
console.log('Config result:', result);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Working directory:', process.cwd());
console.log('Script directory:', __dirname);
