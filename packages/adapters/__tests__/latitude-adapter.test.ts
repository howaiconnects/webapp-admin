import { LatitudeAdapter } from '../latitude-adapter'
import { AdapterError } from '../types/adapter'

// Mock fetch globally
global.fetch = jest.fn()

describe('LatitudeAdapter', () => {
  let adapter: LatitudeAdapter
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    adapter = new LatitudeAdapter()
    mockFetch.mockClear()
  })

  describe('init', () => {
    it('should initialize successfully with API key', async () => {
      const config = { apiKey: 'test-key' }
      await expect(adapter.init(config)).resolves.not.toThrow()
      expect(adapter.config.apiKey).toBe('test-key')
    })

    it('should initialize with environment variable API key', async () => {
      process.env.LATITUDE_SECRET = 'env-key'
      const config = {}
      await expect(adapter.init(config)).resolves.not.toThrow()
      expect(adapter.config.apiKey).toBe('env-key')
      delete process.env.LATITUDE_SECRET
    })

    it('should throw error when no API key provided', async () => {
      delete process.env.LATITUDE_SECRET
      await expect(adapter.init({})).rejects.toThrow(AdapterError)
      await expect(adapter.init({})).rejects.toThrow('Latitude API key or secret is required')
    })

    it('should initialize with custom baseUrl', async () => {
      const config = { apiKey: 'test-key', baseUrl: 'https://custom.latitude.com' }
      await adapter.init(config)
      expect(adapter.config.baseUrl).toBe('https://custom.latitude.com')
    })
  })

  describe('runPrompt', () => {
    beforeEach(async () => {
      await adapter.init({ apiKey: 'test-key' })
    })

    it('should successfully run prompt and return response', async () => {
      const mockResponse = { id: '123', result: 'Test output' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await adapter.runPrompt('test-prompt-id', { param: 'value' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://latitude.totallybot.com/api/v1/prompts/test-prompt-id/run',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key',
          },
          body: JSON.stringify({ param: 'value' }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' }),
      } as Response)

      await expect(adapter.runPrompt('test-prompt-id')).rejects.toThrow(AdapterError)
      await expect(adapter.runPrompt('test-prompt-id')).rejects.toThrow('AUTH_FAILED')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(adapter.runPrompt('test-prompt-id')).rejects.toThrow(AdapterError)
    })

    it('should retry on rate limit errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)

      const result = await adapter.runPrompt('test-prompt-id')
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ success: true })
    })
  })

  describe('execute', () => {
    beforeEach(async () => {
      await adapter.init({ apiKey: 'test-key' })
    })

    it('should execute runPrompt operation', async () => {
      const mockResponse = { result: 'Executed' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await adapter.execute('runPrompt', {
        promptId: 'test-id',
        params: { key: 'value' }
      })

      expect(result).toEqual(mockResponse)
    })

    it('should throw error for unsupported operation', async () => {
      await expect(adapter.execute('unsupported-op', {})).rejects.toThrow(AdapterError)
      await expect(adapter.execute('unsupported-op', {})).rejects.toThrow('Operation \'unsupported-op\' not supported')
    })
  })

  describe('listResources', () => {
    beforeEach(async () => {
      await adapter.init({ apiKey: 'test-key' })
    })

    it('should list resources successfully', async () => {
      const mockResources = [{ id: '1', name: 'Prompt 1' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompts: mockResources }),
      } as Response)

      const result = await adapter.listResources('prompts')
      expect(result).toEqual(mockResources)
    })

    it('should handle API errors in listResources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(adapter.listResources('prompts')).rejects.toThrow(AdapterError)
      await expect(adapter.listResources('prompts')).rejects.toThrow('NOT_FOUND')
    })
  })

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      await adapter.init({ apiKey: 'test-key' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)

      const isHealthy = await adapter.healthCheck()
      expect(isHealthy).toBe(true)
    })

    it('should return false when API is unhealthy', async () => {
      await adapter.init({ apiKey: 'test-key' })
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'))

      const isHealthy = await adapter.healthCheck()
      expect(isHealthy).toBe(false)
    })
  })

  describe('close', () => {
    it('should close without errors', async () => {
      await adapter.init({ apiKey: 'test-key' })
      await expect(adapter.close()).resolves.not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should map HTTP status codes to error codes correctly', async () => {
      await adapter.init({ apiKey: 'test-key' })

      const statusTests = [
        { status: 401, expectedCode: 'AUTH_FAILED' },
        { status: 403, expectedCode: 'FORBIDDEN' },
        { status: 404, expectedCode: 'NOT_FOUND' },
        { status: 429, expectedCode: 'RATE_LIMIT' },
        { status: 500, expectedCode: 'SERVER_ERROR' },
        { status: 418, expectedCode: 'API_ERROR' }, // Unknown status
      ]

      for (const { status, expectedCode } of statusTests) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Test',
        } as Response)

        await expect(adapter.runPrompt('test')).rejects.toThrow(expectedCode)
      }
    })

    it('should handle malformed JSON responses', async () => {
      await adapter.init({ apiKey: 'test-key' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') },
      } as Response)

      await expect(adapter.runPrompt('test')).rejects.toThrow()
    })
  })
})
