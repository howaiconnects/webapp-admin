import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'node:crypto'

/**
 * Server route: /api/zapier/token
 *
 * Returns a short-lived JWT suitable for use as a Zapier "API key" for testing.
 * - Requires a logged-in session (reads cookies via Supabase server client cookie pattern).
 * - If SUPABASE_SERVICE_ROLE_KEY is not configured, returns a preview token for dev use.
 *
 * Security notes:
 * - This route must remain server-side only and never expose service keys to client bundles.
 * - The token produced here is signed with SUPABASE_SERVICE_ROLE_KEY using HS256 for compatibility
 *   with existing Supabase JWT usage in the codebase. Adjust signing strategy if your production
 *   environment requires different token claims / signing algorithm.
 */

/**
 * Small helper: create the server-side Supabase-like client cookie accessor used elsewhere.
 * We don't need the full supabase client here; only session validation is required.
 */
async function createServerCookieStore() {
  // cookies() types can vary between Next.js versions; coerce to `any` locally to avoid
  // treating it as a Promise<ReadonlyRequestCookies> in some ambient typings.
  const cookieStore = cookies() as any
  return {
    async getAll() {
      // Support both sync and async cookie API shapes.
      const maybe = cookieStore.getAll?.()
      if (maybe && typeof (maybe as any).then === 'function') {
        return await (maybe as Promise<any>)
      }
      return maybe ?? []
    },
    setAll() {
      // intentionally no-op: route is a simple helper and doesn't need to set cookies
      return
    },
  }
}

/**
 * Require a logged-in session. This mirrors the project's pattern used in other routes.
 * Returns an object with a minimal session presence check (does not validate token signature).
 */
async function requireSession() {
  const cookieStore = await createServerCookieStore()

  // Attempt to read Supabase session cookie name from env (best effort).
  // If the app uses a different cookie name, adjust accordingly.
  const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'supabase-auth-token'

  const allCookies = await cookieStore.getAll()
  const sessionCookie = allCookies.find((c: any) => c.name === sessionCookieName) ?? null

  // Determine actor id for telemetry: prefer session cookie value, fallback to any sb-* cookie, else 'unknown'
  let actor = 'unknown'
  if (sessionCookie && sessionCookie.value) {
    actor = sessionCookie.value
  } else {
    const fallback = allCookies.find((c: any) => c.name?.startsWith('sb-')) ?? null
    if (fallback && fallback.value) {
      actor = fallback.value
    }
  }

  if (!sessionCookie && actor === 'unknown') {
    throw new Error('UNAUTHORIZED')
  }

  // Minimal presence check succeeded; return actor for telemetry/audit
  return { authenticated: true, actor }
}

/**
 * Base64url helper
 */
function base64url(input: Buffer | string) {
  const buff = typeof input === 'string' ? Buffer.from(input) : input
  return buff.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Sign a JWT using HS256 with the provided secret.
 * Returns the compact JWT string.
 */
function signJwtHS256(payload: Record<string, any>, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(payload))
  const data = `${headerB64}.${payloadB64}`
  const signature = crypto.createHmac('sha256', secret).update(data).digest()
  const sigB64 = base64url(signature)
  return `${data}.${sigB64}`
}

/**
 * GET handler: returns { token, expires_at }
 */
export async function GET() {
  try {
    await requireSession()
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const HOWAI_ISS = process.env.HOWAI_ISS || 'howaiconnects'
  const subject = 'zapier-service' // subject claim for tokens created for Zapier flows

  // TTL: 5 minutes (300 seconds)
  const ttlSeconds = 300
  const now = Math.floor(Date.now() / 1000)
  const exp = now + ttlSeconds

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    // Dev fallback: return a preview token and clearly mark it as a preview
    const previewPayload: Record<string, any> = {
      iss: HOWAI_ISS,
      sub: subject,
      iat: now,
      exp,
      preview: true,
      note: 'SUPABASE_SERVICE_ROLE_KEY not configured; this is a preview token for local/dev usage only',
    }

    // Attach dev scoping claims from env if present (mirrors production payload behavior)
    const previewOrgId = process.env.HOWAI_DEFAULT_ORG_ID || null
    const previewAllowedActionsEnv = process.env.HOWAI_ZAPIER_ALLOWED_ACTIONS || ''
    const previewAllowedActions = previewAllowedActionsEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (previewOrgId) {
      previewPayload['howai:org'] = previewOrgId
    }
    if (previewAllowedActions.length > 0) {
      previewPayload['howai:allowed_actions'] = previewAllowedActions
    }

    const token = signJwtHS256(previewPayload, 'preview-secret')
    return NextResponse.json({
      token,
      expires_at: new Date(exp * 1000).toISOString(),
      preview: true,
      message:
        'SUPABASE_SERVICE_ROLE_KEY not set — returned a preview token for local/dev testing. Configure SUPABASE_SERVICE_ROLE_KEY in your server env to produce real short-lived tokens.',
    })
  }

  // Create a minimal token payload. Adjust claims according to your RBAC / verification needs.
  // Add optional scoping claims:
  // - howai:org -> organization id this token is scoped to (useful for multi-tenant checks)
  // - howai:allowed_actions -> list of permitted actions the token may perform (e.g., ['create_prompt'])
  // These can be provided via environment variables for now, or set by a future enhancement
  // that resolves the user's org from their session.
  const defaultOrgId = process.env.HOWAI_DEFAULT_ORG_ID || null
  // Comma-separated list in env, e.g. "create_prompt,create_user,read_prompts"
  const defaultAllowedActionsEnv = process.env.HOWAI_ZAPIER_ALLOWED_ACTIONS || ''
  const defaultAllowedActions = defaultAllowedActionsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const payload: Record<string, any> = {
    iss: HOWAI_ISS,
    sub: subject,
    iat: now,
    exp,
  }

  // Attach scoping claims only when they are available to avoid breaking verification.
  if (defaultOrgId) {
    payload['howai:org'] = defaultOrgId
  }
  if (defaultAllowedActions.length > 0) {
    payload['howai:allowed_actions'] = defaultAllowedActions
  }

  const token = signJwtHS256(payload, SUPABASE_SERVICE_ROLE_KEY)

  // Telemetry / audit log for real token issuance
  try {
    const sessionInfo = await requireSession().catch(() => ({ actor: 'unknown' }))
    const actor = (sessionInfo as any).actor ?? 'unknown'
    console.info('[zapier:token] issued token', {
      actor,
      issued_at: new Date(now * 1000).toISOString(),
      expires_at: new Date(exp * 1000).toISOString(),
      preview: false,
      org: payload['howai:org'] ?? null,
      allowed_actions: payload['howai:allowed_actions'] ?? null,
    })
  } catch (e) {
    console.warn('[zapier:token] telemetry failed to capture actor for token issuance', e)
  }

  return NextResponse.json({
    token,
    expires_at: new Date(exp * 1000).toISOString(),
    preview: false,
  })
}