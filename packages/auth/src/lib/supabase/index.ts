/**
 * Centralized Supabase helper re-exports.
 *
 * This module re-exports the server/browser helpers so other packages/apps can
 * import a single path: '@howaiconnects/auth/lib/supabase'
 *
 * Expected exports:
 * - createServerClient  (server-side helper)
 * - createBrowserClient (browser/helper for client-side)
 *
 * If your server/client files use different export names, update these re-exports
 * to match (e.g. `export { createClient as createServerClient } from './server'`).
 */

/* Re-export server and client helpers from local files (alias createClient -> named helpers) */
export { createClient as createServerClient, refreshSessionIfNeeded } from './server';
export { createClient as createBrowserClient } from './client';