import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
/**
 * Create a server Supabase client that persists sessions using Next's cookies.
 *
 * Accepts an optional cookieAdapter (with getAll and setAll) to allow middleware
 * or other runtimes to provide their own cookie store. If omitted, the Next
 * cookies() helper is used.
 *
 * This helper enforces secure cookie defaults and sets auth.persistSession so
 * Supabase is responsible for refresh token rotation/persistence.
 */
export async function createClient(cookieAdapter?: {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookiesToSet: Array<{ name: string; value: string; options?: any }>) => void;
}) {
  const cookieStore = cookieAdapter ?? (await cookies());

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Keep server clients persisting sessions so Supabase sets the auth cookies
      // via the provided cookies helper. We also normalize cookie options to
      // enforce secure defaults (httpOnly, sameSite, secure in prod).
      auth: { persistSession: true },
      cookies: {
        getAll() {
          // Some adapters (like Next's cookies) return objects with more fields.
          // Normalize to the shape Supabase expects.
          // @ts-ignore
          return cookieStore.getAll ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet: any[]) {
          try {
            const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
            cookiesToSet.forEach(({ name, value, options }) => {
              // enforce secure defaults while preserving adapter-provided options
              const safeOptions = {
                httpOnly: true,
                sameSite: "lax" as const,
                secure: isProd,
                path: options?.path ?? "/",
                expires: options?.expires ?? undefined,
                ...options,
              };
              try {
                // Some cookie stores accept (name, value, options)
                // @ts-ignore
                cookieStore.set(name, value, safeOptions);
              } catch {
                // Fallback: some runtimes expect cookieStore.set(options)
                // @ts-ignore
                if (typeof cookieStore.set === "function") {
                  try {
                    // try single-object call
                    // @ts-ignore
                    cookieStore.set({ name, value, ...safeOptions });
                  } catch {
                    // ignore
                  }
                }
              }
            });
          } catch {
            // In some server component contexts cookie stores are immutable; swallowing
            // errors is acceptable here because middleware handles refresh in those cases.
          }
        },
      },
    }
  );
}

/**
 * Helper to proactively refresh session if needed.
 * Some runtimes may want to call this before reading user data.
 */
export async function refreshSessionIfNeeded(supabase: ReturnType<typeof createServerClient>) {
  try {
    // The Supabase server client exposes auth methods
    // Try to get session; if not present, attempt refresh via the SDK (if available).
    // This is a best-effort helper — the SDK may handle refresh automatically if persistSession is true.
    // @ts-ignore
    const sessionRes = await supabase.auth.getSession?.();
    // If session exists and user present, nothing to do
    if (sessionRes?.data?.session) return sessionRes.data.session;

    // If SDK exposes refresh API, attempt to refresh. Newer SDKs rotate tokens automatically.
    // @ts-ignore
    if (typeof supabase.auth.refreshSession === "function") {
      // @ts-ignore
      const refreshed = await supabase.auth.refreshSession();
      return refreshed?.data?.session ?? null;
    }

    return null;
  } catch {
    return null;
  }
}