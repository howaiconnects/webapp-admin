import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, refreshSessionIfNeeded } from '@howaiconnects/auth/lib/supabase';

/**
 * Lightweight integration endpoint to exercise the refresh flow.
 * - Creates a server supabase client using the incoming request cookies.
 * - Calls refreshSessionIfNeeded and returns the resulting session (or null).
 *
 * Use this to manually verify middleware/refresh behavior:
 * 1) Sign in in the admin app.
 * 2) Call GET /api/test-refresh (in browser or curl) and inspect the returned session.
 *
 * Note: This endpoint is intentionally minimal and should only be used in development.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Adapter that normalizes Next's req.cookies -> the shape expected by createClient
    const cookieAdapter = {
      getAll: () => {
        // req.cookies is an object map of name -> value
        return Object.entries(req.cookies || {}).map(([name, value]) => ({ name, value }));
      },
      setAll: (cookiesToSet: Array<{ name: string; value: string; options?: any }>) => {
        // Build Set-Cookie headers and append them to the response.
        // We preserve existing Set-Cookie headers if present.
        const existing = res.getHeader('Set-Cookie');
        const headers: string[] = Array.isArray(existing)
          ? existing.map(String)
          : existing
          ? [String(existing)]
          : [];

        cookiesToSet.forEach(({ name, value, options }) => {
          const parts = [`${name}=${value}`];
          if (options) {
            if (options.path) parts.push(`Path=${options.path}`);
            if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
            if (options.httpOnly) parts.push(`HttpOnly`);
            if (options.secure) parts.push(`Secure`);
            if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
          }
          headers.push(parts.join('; '));
        });

        res.setHeader('Set-Cookie', headers);
      },
    };

    const supabase = await createServerClient(cookieAdapter);

    // Attempt refresh (best-effort). Returns session or null.
    const session = await refreshSessionIfNeeded(supabase);

    res.status(200).json({ ok: true, session });
  } catch (err: any) {
    console.error('test-refresh error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}