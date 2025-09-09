import { LatitudeAdapter } from '../latitude-adapter'

// Mock global fetch
global.fetch = jest.fn()

describe('LatitudeAdapter (cloud vs legacy header selection and health)', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
  afterEach(() => {
    mockFetch.mockClear()
    delete process.env.LATITUDE_USE_CLOUD
    delete process.env.LATITUDE_CLOUD_API_KEY
    delete process.env.LATITUDE_CLOUD_BASE_URL
    delete process.env.LATITUDE_SECRET
    delete process.env.LATITUDE_HOST
  })

  it('uses cloud defaults when LATITUDE_USE_CLOUD=true and attaches cloud bearer token', async () => {
    process.env.LATITUDE_USE_CLOUD = 'true'
    process.env.LATITUDE_CLOUD_API_KEY = 'cloud-key'
    process.env.LATITUDE_CLOUD_BASE_URL = 'https://api.latitude.so'

    const adapter = new LatitudeAdapter()
    await adapter.init({}) // should pick up env cloud key

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'run1' }),
    } as Response)

    const res = await adapter.runPrompt('prompt-1', { foo: 'bar' })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(String(url)).toContain('https://api.latitude.so/api/v1/prompts/prompt-1/run')
    // headers include cloud Authorization Bearer and no legacy secret
    expect((opts as any).headers['Authorization']).toBe('Bearer cloud-key')
    expect(res).toEqual({ id: 'run1' })
  })

  it('uses legacy host/secret when LATITUDE_USE_CLOUD=false and preserves legacy auth', async () => {
    process.env.LATITUDE_USE_CLOUD = 'false'
    process.env.LATITUDE_SECRET = 'legacy-secret'
    process.env.LATITUDE_HOST = 'https://legacy.latitude.local'

    const adapter = new LatitudeAdapter()
    await adapter.init({})

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'legacy-run' }),
    } as Response)

    const res = await adapter.runPrompt('p2', {})

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(String(url)).toContain('https://legacy.latitude.local/api/v1/prompts/p2/run')
    // legacy secret forwarded as Bearer for compatibility
    expect((opts as any).headers['Authorization']).toBe('Bearer legacy-secret')
    expect(res).toEqual({ id: 'legacy-run' })
  })

  it('attaches x-supabase-jwt header when supabaseJwt is passed to runPrompt', async () => {
    process.env.LATITUDE_USE_CLOUD = 'true'
    process.env.LATITUDE_CLOUD_API_KEY = 'cloud-key'

    const adapter = new LatitudeAdapter()
    await adapter.init({})

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    const res = await adapter.runPrompt('p3', { q: 1 }, { supabaseJwt: 'jwt-token-123' } as any)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [, opts] = mockFetch.mock.calls[0]
    expect((opts as any).headers['x-supabase-jwt']).toBe('jwt-token-123')
    expect(res).toEqual({ ok: true })
  })

  it('healthCheck returns ok when endpoint responds 200', async () => {
    process.env.LATITUDE_USE_CLOUD = 'true'
    process.env.LATITUDE_CLOUD_API_KEY = 'cloud-key'
    process.env.LATITUDE_CLOUD_BASE_URL = 'https://api.latitude.so'

    const adapter = new LatitudeAdapter()
    await adapter.init({})

    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response)

    const status = await adapter.healthCheck()
    expect(status.ok).toBe(true)
    expect(status.host).toBe('https://api.latitude.so')
    expect(typeof status.latencyMs).toBe('number')
  })
})