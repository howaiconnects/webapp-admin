/*
  CI smoke tests scaffold for Latitude proxy route.

  - Mocks Supabase server client to simulate authenticated/unauthenticated sessions.
  - Mocks LatitudeAdapter and global.fetch for safe, network-free assertions.
  - Verifies:
    1) unauthenticated requests return 401/403
    2) authenticated GET returns sanitized response (mocked adapter.listPrompts)
    3) authenticated POST (run prompt) returns 200 with mocked response
*/

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Minimal Request helper for App Router handlers
class MockRequest {
  url: string
  method: string
  headers: Record<string, string>
  _body: any
  constructor(url = 'http://localhost/api/latitude', method = 'GET', body: any = null, headers: Record<string, string> = {}) {
    this.url = url
    this.method = method
    this.headers = headers
    this._body = body
  }
  async json() {
    return this._body
  }
}

// normalize response helper (compatible with Response-like and NextResponse-like)
function normalizeResponse(maybeResponse: any, res?: any) {
  if (maybeResponse && typeof maybeResponse.status === 'function' && typeof maybeResponse.json === 'function') {
    return { status: (maybeResponse as any).status ?? 200, body: maybeResponse.json ? maybeResponse.json() : null }
  }
  return { status: res?.statusCode ?? 200, body: res?.body ?? null }
}

// Mock the Supabase server factory and LatitudeAdapter used by the route
vi.mock('../../../../packages/auth/src/lib/supabase/server', () => {
  return {
    createClient: vi.fn(),
  }
})

vi.mock('../../../../packages/adapters/latitude-adapter', async () => {
  return {
    LatitudeAdapter: vi.fn().mockImplementation(() => {
      return {
        init: vi.fn().mockResolvedValue(undefined),
        listPrompts: vi.fn().mockResolvedValue([]),
        runPrompt: vi.fn().mockResolvedValue({}),
        close: vi.fn().mockResolvedValue(undefined),
        config: { baseUrl: 'https://latitude.totallybot.com', apiKey: 'mock-latitude-key' },
      }
    }),
  }
})

// Import mocks & route after mocking
import * as supabaseServer from '../../../../packages/auth/src/lib/supabase/server'
import { LatitudeAdapter as MockedLatitudeAdapter } from '../../../../packages/adapters/latitude-adapter'
import * as routeModule from '../../app/api/latitude/route' // route path may vary; adjust if needed

const { GET, POST } = routeModule as any

describe('Latitude API route - smoke tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    delete process.env.SUPABASE_ANON_KEY
    delete process.env.SUPABASE_URL
    // ensure default env for latitude adapters during CI
    delete process.env.LATITUDE_SECRET
    delete process.env.LATITUDE_USE_CLOUD
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 when no Supabase session exists', async () => {
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: { getSession: async () => ({ data: { session: null } }) },
    })

    const req = new MockRequest('http://localhost/api/latitude', 'GET')
    const maybeResponse = await GET?.(req as any)
    const result = await normalizeResponse(maybeResponse)
    expect([401, 403]).toContain(result.status)
  })

  it('authenticated GET returns prompts via mocked LatitudeAdapter', async () => {
    const fakeSession = { user: { id: 'user-1' } }
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: { getSession: async () => ({ data: { session: fakeSession } }) },
    })

    const samplePrompts = [{ id: 'p1', name: 'Test Prompt' }]
    const adapterInstance = new (MockedLatitudeAdapter as any)()
    ;(adapterInstance.listPrompts as any).mockResolvedValue(samplePrompts)
    ;(MockedLatitudeAdapter as any).mockImplementation(() => adapterInstance)

    const req = new MockRequest('http://localhost/api/latitude', 'GET')
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
    expect(Array.isArray(body)).toBe(true)
    expect(body[0]).toEqual({ id: 'p1', name: 'Test Prompt' })
  })

  it('authenticated POST runs a prompt and returns 200 (mocking adapter & fetch)', async () => {
    const fakeSession = { user: { id: 'user-1' } }
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: { getSession: async () => ({ data: { session: fakeSession } }) },
    })

    const adapterInstance = new (MockedLatitudeAdapter as any)()
    ;(MockedLatitudeAdapter as any).mockImplementation(() => adapterInstance)

    // Mock runPrompt response
    const runResult = { id: 'run-1', output: 'generated content' }
    ;(adapterInstance.runPrompt as any).mockResolvedValue(runResult)

    const body = { promptId: 'p1', inputs: { text: 'hello' } }
    const req = new MockRequest('http://localhost/api/latitude', 'POST', body, { 'content-type': 'application/json' })
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
    expect(responseBody).toEqual(runResult)
  })
})