import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '../../../../packages/auth/src/lib/supabase/server'
import { MiroAdapter } from '../../../../packages/adapters/miro-adapter'

/**
 * Minimal Miro proxy route used by CI smoke tests.
 * - Exports GET and POST (and fallbacks for PATCH/DELETE) to match tests.
 * - Uses server-side Supabase client for session checks.
 * - Creates a MiroAdapter instance, delegates operations, and returns sanitized JSON.
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

  // Support fetching basic board info for smoke tests.
  try {
    const adapter = new MiroAdapter()
    await adapter.init({})
    try {
      const url = new URL(req.url)
      const boardId = url.searchParams.get('boardId')
      if (!boardId) {
        await adapter.close?.()
        return NextResponse.json({ error: 'missing_board_id' }, { status: 400 })
      }
      const info = await adapter.getBoardInfo?.(boardId)
      await adapter.close?.()
      return NextResponse.json(info ?? {}, { status: 200 })
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
  const { boardId, op, payload } = body as any

  if (!boardId || !op) {
    return NextResponse.json({ error: 'missing_parameters' }, { status: 400 })
  }

  try {
    const adapter = new MiroAdapter()
    await adapter.init({})
    try {
      // adapter.execute is expected to be mocked by tests
      const result = await adapter.execute(op, { boardId, payload })
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

export async function PATCH(req: NextRequest) {
  return NextResponse.json({ error: 'not_implemented' }, { status: 405 })
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: 'not_implemented' }, { status: 405 })
}