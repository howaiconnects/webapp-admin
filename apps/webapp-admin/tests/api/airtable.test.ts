/*
  Expanded CI smoke tests for Airtable API route.

  - Adds an authenticated flow that mocks Supabase session and the AirtableAdapter.
  - Verifies:
    1) unauthenticated requests return 401/403 (existing test)
    2) authenticated GET returns 200 with sanitized records (mocked adapter.listRecords)
    3) authenticated POST returns 201 when adapter + fetch succeed (mocked global.fetch)

  Notes:
  - Uses vitest mocking APIs (vi) to stub internal imports.
  - Adjust import paths if your Next.js handler resolution differs in CI.
*/

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Minimal Request/Response helpers for App Router handlers
class MockRequest {
  url: string
  method: string
  headers: Record<string, string>
  _body: any
  constructor(url = 'http://localhost/api/airtable', method = 'GET', body: any = null, headers: Record<string, string> = {}) {
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

// We'll mock the server-side Supabase client factory and the AirtableAdapter used inside the route.
// The route imports:
//   createClient from packages/auth/src/lib/supabase/server
//   AirtableAdapter from packages/adapters/airtable-adapter
// We'll replace those modules with controlled mocks.

vi.mock('../../../../packages/auth/src/lib/supabase/server', () => {
  return {
    // createClient returns an object with auth.getSession()
    createClient: vi.fn(),
  }
})

vi.mock('../../../../packages/adapters/airtable-adapter', async () => {
  // Provide a minimal mock AirtableAdapter class shape
  return {
    AirtableAdapter: vi.fn().mockImplementation(() => {
      return {
        init: vi.fn().mockResolvedValue(undefined),
        listRecords: vi.fn().mockResolvedValue([]),
        close: vi.fn().mockResolvedValue(undefined),
        config: { baseUrl: 'https://api.airtable.com/v0', apiKey: 'mock-key' },
      }
    }),
  }
})

// Import the route handlers after mocking so the mocks are used by the module under test
import * as supabaseServer from '../../../../packages/auth/src/lib/supabase/server'
import { AirtableAdapter as MockedAirtableAdapter } from '../../../../packages/adapters/airtable-adapter'
import * as routeModule from '../../app/api/airtable/route'

// Normalize exports (named handlers GET/POST etc. expected)
const { GET, POST } = routeModule as any

describe('Airtable API route - expanded smoke tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Ensure CI runs with minimal env by default
    delete process.env.SUPABASE_ANON_KEY
    delete process.env.SUPABASE_URL
  })

  afterEach(() => {
    // restore globals
    vi.restoreAllMocks()
  })

  it('returns 401 when no Supabase session exists', async () => {
    // Make createClient return a supabase client with no session
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: {
        getSession: async () => ({ data: { session: null } }),
      },
    })

    const req = new MockRequest('http://localhost/api/airtable', 'GET')
    const maybeResponse = await GET?.(req as any)
    const result = await normalizeResponse(maybeResponse)
    expect([401, 403]).toContain(result.status)
  })

  it('authenticated GET returns sanitized records via mocked AirtableAdapter', async () => {
    // Mock a valid Supabase session
    const fakeSession = { user: { id: 'user-123' } }
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: {
        getSession: async () => ({ data: { session: fakeSession } }),
      },
    })

    // Mock adapter.listRecords to return sample Airtable records
    const sampleRecords = [
      { id: 'rec1', fields: { Name: 'Test' }, createdTime: '2025-01-01T00:00:00.000Z' },
      { id: 'rec2', fields: { Name: 'Another' }, createdTime: '2025-01-02T00:00:00.000Z' },
    ]
    const adapterInstance = new (MockedAirtableAdapter as any)()
    ;(adapterInstance.listRecords as any).mockResolvedValue(sampleRecords)
    ;(MockedAirtableAdapter as any).mockImplementation(() => adapterInstance)

    const req = new MockRequest('http://localhost/api/airtable?baseId=test-base&table=test-table', 'GET')
    const maybeResponse = await GET?.(req as any)
    // If handler returned a Response-like, parse json; otherwise we expect NextResponse.json shape
    const resolved = maybeResponse && typeof maybeResponse.json === 'function' ? maybeResponse : null
    let status: number, body: any
    if (resolved) {
      status = (resolved as any).status ?? 200
      body = await (resolved as any).json()
    } else {
      // Some handlers mutate and return NextResponse objects; try to coerce
      const normalized = await normalizeResponse(maybeResponse, undefined)
      status = normalized.status
      body = await normalized.body
    }

    expect(status).toBe(200)
    // Body should be an array of sanitized records (id, fields, createdTime)
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(2)
    expect(body[0]).toEqual({ id: 'rec1', fields: { Name: 'Test' }, createdTime: '2025-01-01T00:00:00.000Z' })
  })

  it('authenticated POST creates a record and returns 201 (mocking global.fetch)', async () => {
    const fakeSession = { user: { id: 'user-123' } }
    ;(supabaseServer.createClient as any).mockResolvedValue({
      auth: { getSession: async () => ({ data: { session: fakeSession } }) },
    })

    // Ensure adapter.init/close are present
    const adapterInstance = new (MockedAirtableAdapter as any)()
    ;(MockedAirtableAdapter as any).mockImplementation(() => adapterInstance)

    // Mock global.fetch to emulate Airtable create response
    const createdRecord = { id: 'rec-created', fields: { Name: 'Created' }, createdTime: '2025-01-03T00:00:00.000Z' }
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => createdRecord,
    })
    // @ts-ignore - overwrite global fetch in test environment
    global.fetch = mockFetch as unknown as typeof fetch

    const body = { baseId: 'test-base', table: 'test-table', fields: { Name: 'Created' } }
    const req = new MockRequest('http://localhost/api/airtable', 'POST', body, { 'content-type': 'application/json' })
    const maybeResponse = await POST?.(req as any)

    let status: number, responseBody: any
    if (maybeResponse && typeof maybeResponse.json === 'function') {
      status = (maybeResponse as any).status ?? 201
      responseBody = await (maybeResponse as any).json()
    } else {
      const normalized = await normalizeResponse(maybeResponse, undefined)
      status = normalized.status
      responseBody = await normalized.body
    }

    expect(status).toBe(201)
    expect(responseBody).toEqual({ id: 'rec-created', fields: { Name: 'Created' }, createdTime: '2025-01-03T00:00:00.000Z' })
    expect(mockFetch).toHaveBeenCalled()
  })
})
// Additional CRUD tests: PATCH and DELETE (mocked fetch + adapter behavior)
it('authenticated PATCH updates a record and returns 200 (mocking global.fetch)', async () => {
  const fakeSession = { user: { id: 'user-123' } }
  ;(supabaseServer.createClient as any).mockResolvedValue({
    auth: { getSession: async () => ({ data: { session: fakeSession } }) },
  })

  // Adapter present
  const adapterInstance = new (MockedAirtableAdapter as any)()
  ;(MockedAirtableAdapter as any).mockImplementation(() => adapterInstance)

  // Mock global.fetch to emulate Airtable update response
  const updatedRecord = { id: 'rec-updated', fields: { Name: 'Updated' }, createdTime: '2025-01-03T00:00:00.000Z' }
  const mockFetchPatch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => updatedRecord,
  })
  // @ts-ignore
  global.fetch = mockFetchPatch as unknown as typeof fetch

  const body = { baseId: 'test-base', table: 'test-table', recordId: 'rec-updated', fields: { Name: 'Updated' } }
  // Some route handlers read body via req.json()
  const req = new MockRequest('http://localhost/api/airtable', 'PATCH', body, { 'content-type': 'application/json' })
  // Try to call PATCH handler if exported
  const maybePatch = (routeModule as any).PATCH ?? (routeModule as any).patch ?? null
  if (!maybePatch) {
    // If no PATCH handler, assert that server responds with 405
    // Call GET to simulate unsupported method (best-effort)
    const fallback = await (routeModule as any).GET?.(req as any)
    const normalized = await normalizeResponse(fallback, undefined)
    const status = normalized.status
    expect([405, 501]).toContain(status)
    return
  }

  const maybeResponse = await maybePatch?.(req as any)
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
  expect(responseBody).toEqual(updatedRecord)
  expect(mockFetchPatch).toHaveBeenCalled()
})

it('authenticated DELETE removes a record and returns 204 (mocking global.fetch)', async () => {
  const fakeSession = { user: { id: 'user-123' } }
  ;(supabaseServer.createClient as any).mockResolvedValue({
    auth: { getSession: async () => ({ data: { session: fakeSession } }) },
  })

  const adapterInstance = new (MockedAirtableAdapter as any)()
  ;(MockedAirtableAdapter as any).mockImplementation(() => adapterInstance)

  // Mock global.fetch to emulate Airtable delete response (204 No Content)
  const mockFetchDelete = vi.fn().mockResolvedValueOnce({
    ok: true,
    status: 204,
    json: async () => ({}),
  })
  // @ts-ignore
  global.fetch = mockFetchDelete as unknown as typeof fetch

  const body = { baseId: 'test-base', table: 'test-table', recordId: 'rec-to-delete' }
  const req = new MockRequest('http://localhost/api/airtable', 'DELETE', body, { 'content-type': 'application/json' })
  const maybeDelete = (routeModule as any).DELETE ?? (routeModule as any).delete ?? null
  if (!maybeDelete) {
    const fallback = await (routeModule as any).GET?.(req as any)
    const normalized = await normalizeResponse(fallback, undefined)
    const status = normalized.status
    expect([405, 501]).toContain(status)
    return
  }

  const maybeResponse = await maybeDelete?.(req as any)
  let status: number
  if (maybeResponse && typeof maybeResponse.status === 'number') {
    status = (maybeResponse as any).status ?? 204
  } else if (maybeResponse && typeof maybeResponse.json === 'function') {
    status = (maybeResponse as any).status ?? 204
  } else {
    const normalized = await normalizeResponse(maybeResponse, undefined)
    status = normalized.status
  }

  // Allow either 200 or 204 depending on implementation
  expect([200, 204]).toContain(status)
  expect(mockFetchDelete).toHaveBeenCalled()
})