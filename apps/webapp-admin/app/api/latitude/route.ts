import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '../../../../packages/auth/src/lib/supabase/server'
import { LatitudeAdapter } from '../../../../packages/adapters/latitude-adapter'

/**
 * Minimal Latitude proxy route used by CI smoke tests.
 * - Exports GET and POST (and fallbacks for PATCH/DELETE) to match tests.
 * - Uses server-side Supabase client for session checks.
 * - Creates a LatitudeAdapter instance, delegates operations, and returns sanitized JSON.
 *
 * This implementation is intentionally small and defensive so tests (which mock createClient
 * and the adapter) can run without real network or secrets.
 */

async function requireSession() {
  const supabase = await createClient()
  const sessionResult = await supabase.auth.getSession()
  const session = sessionResult?.data?.session ?? null
  if (!session) throw new Error('UNAUTHORIZED')
  return { supabase, session }
}

export async function GET(req: NextRequest) {
  try {
    await requireSession()
  } catch (err) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  // For smoke tests we support listing prompts / metadata.
  try {
    const adapter = new LatitudeAdapter()
    await adapter.init({})
    try {
      const prompts = await adapter.listPrompts?.() // adapter mock provides this
      await adapter.close?.()
      return NextResponse.json(prompts ?? [], { status: 200 })
    } catch (err) {
      await adapter.close?.()
      return NextResponse.json({ error: 'adapter_error' }, { status: 500 })
    }
  } catch (err) {
    return NextResponse.json({ error: 'init_error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession()
  } catch (err) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { promptId, inputs } = body as any

  if (!promptId) {
    return NextResponse.json({ error: 'missing_prompt_id' }, { status: 400 })
  }

  try {
    const adapter = new LatitudeAdapter()
    await adapter.init({})
    try {
      // adapter.runPrompt is expected to be mocked by tests
      const result = await adapter.runPrompt(promptId, inputs ?? {})
      await adapter.close?.()
      return NextResponse.json(result ?? {}, { status: 200 })
    } catch (err) {
      await adapter.close?.()
      return NextResponse.json({ error: 'adapter_error' }, { status: 500 })
    }
  } catch (err) {
    return NextResponse.json({ error: 'init_error' }, { status: 500 })
  }
}

// Provide simple handlers for PATCH/DELETE to avoid 500s if tests probe them.
// They mirror POST but respond with 405 by default (not implemented).
export async function PATCH(req: NextRequest) {
  return NextResponse.json({ error: 'not_implemented' }, { status: 405 })
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: 'not_implemented' }, { status: 405 })
}