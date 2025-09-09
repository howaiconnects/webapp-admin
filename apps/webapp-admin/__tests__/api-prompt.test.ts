/// <reference types="jest" />
/**
 * Tests for /api/prompt route (streaming and non-streaming)
 *
 * Run with:
 *   pnpm test apps/webapp-admin/__tests__/api-prompt.test.ts
 *
 * Notes:
 * - Mocks @howaiconnects/adapters LatitudeAdapter.
 * - Uses node-mocks-http to simulate Next.js req/res.
 */
 
// Force use of Jest globals types by importing the runtime helpers from @jest/globals.
// This ensures TypeScript resolves the correct `expect` / `jest` shape instead of
// ambient Cypress/Chai types that exist elsewhere in the monorepo devDependencies.

import { createMocks } from 'node-mocks-http'
 
// Force loose Jest-like globals for this test file to avoid Cypress/Chai collisions
declare const expect: any
declare const jest: any
import handler from '../app/api/prompt/route'
import { LatitudeAdapter as RealAdapter } from '@howaiconnects/adapters'

jest.mock('@howaiconnects/adapters')

const MockedAdapter = RealAdapter as unknown as jest.Mock

beforeEach(() => {
  MockedAdapter.mockClear()
  // Ensure environment default for tests
  process.env.LATITUDE_USE_CLOUD = 'false'
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
})

function makeAuthHeaders(token = 'test-token') {
  return { authorization: `Bearer ${token}` }
}

test('non-streaming: returns JSON reply from runChat', async () => {
  // Arrange: mock adapter instance and runChat
  const initMock = jest.fn().mockResolvedValue(undefined)
  const runChatMock = jest.fn().mockResolvedValue({ text: 'hello' })

  const adapterInstance = {
    init: initMock,
    runChat: runChatMock,
  }
  MockedAdapter.mockImplementation(() => adapterInstance)

  const { req, res } = createMocks({
    method: 'POST',
    headers: makeAuthHeaders(),
    body: { message: 'hi', history: [] },
  })

  // Act
  await handler(req as any, res as any)

  // Assert
  expect(initMock).toHaveBeenCalledWith(expect.objectContaining({ authToken: expect.any(String) }))
  expect(runChatMock).toHaveBeenCalledWith('hi', [], expect.any(Object))
  expect(res._getStatusCode()).toBe(200)
  const json = JSON.parse(res._getData() || '{}')
  expect(json).toHaveProperty('reply')
  expect(json.reply).toEqual({ text: 'hello' })
})

test('streaming: uses runChatStream when LATITUDE_USE_CLOUD=true and stream=true', async () => {
  // Enable cloud streaming
  process.env.LATITUDE_USE_CLOUD = 'true'

  // Create an async generator to simulate streaming chunks
  async function* chunkGenerator() {
    yield { part: 'hello' }
    yield { part: ' world' }
  }

  const initMock = jest.fn().mockResolvedValue(undefined)
  const runChatStreamMock = jest.fn().mockImplementation(() => chunkGenerator())
  const runChatMock = jest.fn().mockResolvedValue({ text: 'fallback' })

  const adapterInstance = {
    init: initMock,
    runChatStream: runChatStreamMock,
    runChat: runChatMock,
  }
  MockedAdapter.mockImplementation(() => adapterInstance)

  const { req, res } = createMocks({
    method: 'POST',
    headers: makeAuthHeaders(),
    url: '/api/prompt?stream=true',
    query: { stream: 'true' },
    body: { message: 'stream me', history: [] },
  })

  // Since the handler writes raw chunks and ends the response, await it
  await handler(req as any, res as any)

  // The adapter init should receive the supabase token
  expect(initMock).toHaveBeenCalledWith(expect.objectContaining({ authToken: expect.any(String), supabaseJwt: expect.any(String) }))
  expect(runChatStreamMock).toHaveBeenCalled()

  // Response should have been ended with streamed chunks. We expect the raw body includes JSON lines.
  const data = res._getData()
  expect(typeof data).toBe('string')
  // It should include the first chunk and the final done marker
  expect(data).toContain(JSON.stringify({ part: 'hello' }))
  expect(data).toContain(JSON.stringify({ done: true }))
  expect(res._getStatusCode()).toBe(200) // handler may not explicitly set status before streaming; node-mocks-http defaults to 200
})