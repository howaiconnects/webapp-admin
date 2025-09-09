/*
  CI smoke tests scaffold for Miro proxy route.

  - Mocks Supabase server client to simulate authenticated/unauthenticated sessions.
  - Mocks MiroAdapter and global.fetch for network-free assertions.
  - Verifies:
    1) unauthenticated requests return 401/403
    2) authenticated GET returns sanitized board info via adapter
    3) authenticated POST (AI or board action) returns 200 with mocked response
*/

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

class MockRequest {
  url: string
  method: string
  headers: Record<string, string>
  _body: any
  constructor(url = 'http://localhost/api/miro', method = 'GET', body: any = null, headers: Record<string, string> = {}) {
    this.url = url
    this.method = method
    this.headers = headers
    this._body = body
  }
  async json() {
    return this._body
  }
}

function normalizeResponse(maybeResponse: any, res?: any) {
  if (maybeResponse && typeof maybeResponse.status === 'function' && typeof maybeResponse.json === 'function') {
    return { status: (maybeResponse as any).status ?? 200, body: maybeResponse.json ? maybeResponse.json() : null }
  }
  return { status: res?.statusCode ?? 200, body: res?.body ?? null }
}

// Mock Supabase server factory and MiroAdapter used by the route
vi.mock('../../../../packages/auth/src/lib/supabase/server', () => {
  return {
    createClient: vi.fn(),
  }
})

vi.mock('../../../../packages/adapters/miro-adapter', async () => {
  return {
    MiroAdapter: vi.fn().mockImplementation(() => {
      return {
        init: vi.fn().mockResolvedValue(undefined),
        getBoardInfo: vi.fn().mockResolvedValue({ id: 'board-1', name: 'Test Board' }),
        execute: vi.fn().mockResolvedValue({ result: 'ok' }),
        close: vi.fn().mockResolvedValue(undefined),
        config: { baseUrl: 'https://miro.com', apiKey: 'mock-miro-key' },
      }
    }),
  }
})

// Import mocks & route after mocking
import * as supabaseServer from '../../../../packages/auth/src/lib/supabase/server'
import { MiroAdapter as MockedMiroAdapter } from '../../../../packages/adapters/miro-adapter'
import * as routeModule from '../../app/api/miro/route' // adjust path if your route lives elsewhere

const { GET, POST } = routeModule as any

describe('Miro API route - smoke tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    delete process.env.SUPABASE_ANON_KEY
    delete process.env.SUPABASE_URL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 when no Supabase session exists', async () => {
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: { getSession: async () => ({ data: { session: null } }) },
    })

    const req = new MockRequest('http://localhost/api/miro', 'GET')
    const maybeResponse = await GET?.(req as any)
    const result = await normalizeResponse(maybeResponse)
    expect([401, 403]).toContain(result.status)
  })

  it('authenticated GET returns board info via mocked MiroAdapter', async () => {
    const fakeSession = { user: { id: 'user-42' } }
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: { getSession: async () => ({ data: { session: fakeSession } }) },
    })

    const adapterInstance = new (MockedMiroAdapter as any)()
    ;(adapterInstance.getBoardInfo as any).mockResolvedValue({ id: 'board-1', name: 'Test Board' })
    ;(MockedMiroAdapter as any).mockImplementation(() => adapterInstance)

    const req = new MockRequest('http://localhost/api/miro?boardId=board-1', 'GET')
    const maybeResponse = await GET?.(req as any)
    const resolved = maybeResponse && typeof maybeResponse.json === 'function' ? maybeResponse : null
    let status: number, body: any
    if (resolved) {
      status = (resolved as any).status ?? 200
      body = await (resolved as any).json()
    } else {
      const normalized = await normalizeResponse(maybeResponse, undefined)
      status = normalized.status
      body = await normalized.body
    }

    expect(status).toBe(200)
    expect(body).toEqual({ id: 'board-1', name: 'Test Board' })
  })

  it('authenticated POST executes adapter action and returns 200', async () => {
    const fakeSession = { user: { id: 'user-42' } }
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: { getSession: async () => ({ data: { session: fakeSession } }) },
    })

    const adapterInstance = new (MockedMiroAdapter as any)()
    ;(MockedMiroAdapter as any).mockImplementation(() => adapterInstance)

    const executeResult = { id: 'op-1', status: 'ok' }
    ;(adapterInstance.execute as any).mockResolvedValue(executeResult)

    const body = { boardId: 'board-1', op: 'snapshot' }
    const req = new MockRequest('http://localhost/api/miro', 'POST', body, { 'content-type': 'application/json' })
    const maybeResponse = await POST?.(req as any)

    let status: number, responseBody: any
    if (maybeResponse && typeof maybeResponse.json === 'function') {
      status = (maybeResponse as any).status ?? 200
      responseBody = await (maybeResponse as any).json()
    } else {
      const normalized = await normalizeResponse(maybeResponse, undefined)
      status = normalized.status
      responseBody = await normalized.body
    }

    expect(status).toBe(200)
    expect(responseBody).toEqual(executeResult)
  })
})