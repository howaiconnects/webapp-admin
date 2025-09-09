import { AirtableAdapter } from '../airtable-adapter'
import { AdapterError } from '../types/adapter'

// Mock fetch globally
global.fetch = jest.fn()

describe('AirtableAdapter', () => {
  let adapter: AirtableAdapter
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    adapter = new AirtableAdapter()
    mockFetch.mockClear()
  })

  describe('init', () => {
    it('should initialize successfully with API key', async () => {
      const config = { apiKey: 'test-key' }
      await expect(adapter.init(config)).resolves.not.toThrow()
      expect(adapter.config.apiKey).toBe('test-key')
    })

    it('should initialize with environment variable API key', async () => {
      process.env.AIRTABLE_API_KEY = 'env-key'
      const config = {}
      await expect(adapter.init(config)).resolves.not.toThrow()
      expect(adapter.config.apiKey).toBe('env-key')
      delete process.env.AIRTABLE_API_KEY
    })

    it('should throw error when no API key provided', async () => {
      delete process.env.AIRTABLE_API_KEY
      await expect(adapter.init({})).rejects.toThrow(AdapterError)
      await expect(adapter.init({})).rejects.toThrow('Airtable API key is required')
    })

    it('should initialize with custom baseUrl', async () => {
      const config = { apiKey: 'test-key', baseUrl: 'https://custom.airtable.com' }
      await adapter.init(config)
      expect(adapter.config.baseUrl).toBe('https://custom.airtable.com')
    })
  })

  describe('listRecords', () => {
    beforeEach(async () => {
      await adapter.init({ apiKey: 'test-key' })
    })

    it('should successfully list records and return data', async () => {
      const mockRecords = [
        { id: 'rec1', fields: { name: 'Test Record 1' } },
        { id: 'rec2', fields: { name: 'Test Record 2' } }
      ]
      const mockResponse = { records: mockRecords }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await adapter.listRecords('test-base', 'test-table')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.airtable.com/v0/test-base/test-table',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-key',
          },
        })
      )
      expect(result).toEqual(mockRecords)
    })

    it('should use cached data when available and not expired', async () => {
      const mockRecords = [{ id: 'rec1', fields: { name: 'Cached Record' } }]
      const mockResponse = { records: mockRecords }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      // First call - should fetch
      await adapter.listRecords('test-base', 'test-table')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second call - should use cache
      const result = await adapter.listRecords('test-base', 'test-table')
      expect(mockFetch).toHaveBeenCalledTimes(1) // Still 1 call
      expect(result).toEqual(mockRecords)
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } }),
      } as Response)

      await expect(adapter.listRecords('test-base', 'test-table')).rejects.toThrow(AdapterError)
      await expect(adapter.listRecords('test-base', 'test-table')).rejects.toThrow('AUTH_FAILED')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(adapter.listRecords('test-base', 'test-table')).rejects.toThrow(AdapterError)
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
          json: async () => ({ records: [] }),
        } as Response)

      const result = await adapter.listRecords('test-base', 'test-table')
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual([])
    })

    it('should handle empty records response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: null }),
      } as Response)

      const result = await adapter.listRecords('test-base', 'test-table')
      expect(result).toEqual([])
    })
  })

  describe('execute', () => {
    beforeEach(async () => {
      await adapter.init({ apiKey: 'test-key' })
    })

    it('should execute listRecords operation', async () => {
      const mockRecords = [{ id: 'rec1', fields: { name: 'Test' } }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords }),
      } as Response)

      const result = await adapter.execute('listRecords', {
        baseId: 'test-base',
        table: 'test-table'
      })

      expect(result).toEqual(mockRecords)
    })

    it('should throw error for missing baseId', async () => {
      await expect(adapter.execute('listRecords', { table: 'test-table' })).rejects.toThrow(AdapterError)
      await expect(adapter.execute('listRecords', { table: 'test-table' })).rejects.toThrow('baseId and table are required for listRecords')
    })

    it('should throw error for missing table', async () => {
      await expect(adapter.execute('listRecords', { baseId: 'test-base' })).rejects.toThrow(AdapterError)
      await expect(adapter.execute('listRecords', { baseId: 'test-base' })).rejects.toThrow('baseId and table are required for listRecords')
    })

    it('should throw error for unsupported operation', async () => {
      await expect(adapter.execute('unsupported-op', {})).rejects.toThrow(AdapterError)
      await expect(adapter.execute('unsupported-op', {})).rejects.toThrow('Operation \'unsupported-op\' not supported')
    })
  })

  describe('listResources', () => {
    it('should return empty array for MVP', async () => {
      await adapter.init({ apiKey: 'test-key' })
      const result = await adapter.listResources('any-type')
      expect(result).toEqual([])
    })
  })

  describe('healthCheck', () => {
    it('should return true when API key is available', async () => {
      await adapter.init({ apiKey: 'test-key' })
      const isHealthy = await adapter.healthCheck()
      expect(isHealthy).toBe(true)
    })

    it('should return false when no API key is available', async () => {
      delete process.env.AIRTABLE_API_KEY
      const freshAdapter = new AirtableAdapter()
      await freshAdapter.init({}) // This should fail but healthCheck should handle it
      const isHealthy = await freshAdapter.healthCheck()
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
    beforeEach(async () => {
      await adapter.init({ apiKey: 'test-key' })
    })

    it('should map HTTP status codes to error codes correctly', async () => {
      const statusTests = [
        { status: 401, expectedCode: 'AUTH_FAILED' },
        { status: 403, expectedCode: 'FORBIDDEN' },
        { status: 404, expectedCode: 'NOT_FOUND' },
        { status: 422, expectedCode: 'INVALID_REQUEST' },
        { status: 429, expectedCode: 'RATE_LIMIT' },
        { status: 500, expectedCode: 'SERVER_ERROR' },
        { status: 418, expectedCode: 'API_ERROR' }, // Unknown status
      ]

      for (const { status, expectedCode } of statusTests) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Test',
          json: async () => ({ error: { message: 'Test error' } }),
        } as Response)

        await expect(adapter.listRecords('test', 'test')).rejects.toThrow(expectedCode)
      }
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') },
      } as Response)

      await expect(adapter.listRecords('test', 'test')).rejects.toThrow()
    })

    it('should handle responses without records property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ someOtherProperty: [] }),
      } as Response)

      const result = await adapter.listRecords('test', 'test')
      expect(result).toEqual([])
    })
  })
})