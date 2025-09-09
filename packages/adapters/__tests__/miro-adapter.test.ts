import { MiroAdapter } from '../miro-adapter'
import { AdapterError } from '../types/adapter'

describe('MiroAdapter', () => {
  let adapter: MiroAdapter

  beforeEach(() => {
    adapter = new MiroAdapter()
  })

  describe('init', () => {
    it('should initialize successfully with default config', async () => {
      await expect(adapter.init({})).resolves.not.toThrow()
      expect(adapter.config.baseUrl).toBe('https://miro.com')
    })

    it('should initialize with custom config', async () => {
      const customConfig = { baseUrl: 'https://custom.miro.com', cacheTtl: 600 }
      await adapter.init(customConfig)
      expect(adapter.config.baseUrl).toBe('https://custom.miro.com')
      expect(adapter.config.cacheTtl).toBe(600)
    })

    it('should throw error for invalid baseUrl', async () => {
      await expect(adapter.init({ baseUrl: '' })).rejects.toThrow(AdapterError)
    })
  })

  describe('initBoard', () => {
    it('should initialize board URL successfully', async () => {
      const boardUrl = 'https://miro.com/app/board/test-board-123/'
      await adapter.init({})
      await expect(adapter.initBoard(boardUrl)).resolves.not.toThrow()
    })

    it('should throw error for empty board URL', async () => {
      await adapter.init({})
      await expect(adapter.initBoard('')).rejects.toThrow(AdapterError)
      await expect(adapter.initBoard('')).rejects.toThrow('Board URL is required')
    })

    it('should throw error for invalid board URL format', async () => {
      await adapter.init({})
      const invalidUrl = 'https://miro.com/invalid-format/'
      await expect(adapter.initBoard(invalidUrl)).rejects.toThrow(AdapterError)
      await expect(adapter.initBoard(invalidUrl)).rejects.toThrow('Invalid Miro board URL format')
    })
  })

  describe('getEmbedUrl', () => {
    it('should return correct embed URL for valid board URL', async () => {
      const boardUrl = 'https://miro.com/app/board/test-board-123/'
      await adapter.init({})
      await adapter.initBoard(boardUrl)

      const embedUrl = adapter.getEmbedUrl()
      expect(embedUrl).toBe('https://miro.com/app/embed/test-board-123/')
    })

    it('should extract board ID correctly from different URL formats', async () => {
      await adapter.init({})

      const testCases = [
        { input: 'https://miro.com/app/board/board-123/', expected: 'https://miro.com/app/embed/board-123/' },
        { input: 'https://miro.com/app/board/abc123def/', expected: 'https://miro.com/app/embed/abc123def/' },
      ]

      for (const { input, expected } of testCases) {
        await adapter.initBoard(input)
        expect(adapter.getEmbedUrl()).toBe(expected)
      }
    })

    it('should throw error when board URL not initialized', async () => {
      await adapter.init({})
      expect(() => adapter.getEmbedUrl()).toThrow(AdapterError)
      expect(() => adapter.getEmbedUrl()).toThrow('Board URL not initialized')
    })
  })

  describe('healthCheck', () => {
    it('should return true when board URL is set', async () => {
      const boardUrl = 'https://miro.com/app/board/test-board-123/'
      await adapter.init({})
      await adapter.initBoard(boardUrl)

      const isHealthy = await adapter.healthCheck()
      expect(isHealthy).toBe(true)
    })

    it('should return false when board URL is not set', async () => {
      await adapter.init({})
      const isHealthy = await adapter.healthCheck()
      expect(isHealthy).toBe(false)
    })
  })

  describe('execute', () => {
    it('should throw not implemented error', async () => {
      await adapter.init({})
      await expect(adapter.execute('any-operation', {})).rejects.toThrow(AdapterError)
      await expect(adapter.execute('any-operation', {})).rejects.toThrow('Execute not implemented for MiroAdapter')
    })
  })

  describe('listResources', () => {
    it('should throw not implemented error', async () => {
      await adapter.init({})
      await expect(adapter.listResources('any-type')).rejects.toThrow(AdapterError)
      await expect(adapter.listResources('any-type')).rejects.toThrow('List resources not implemented for MiroAdapter')
    })
  })

  describe('close', () => {
    it('should close without errors', async () => {
      await adapter.init({})
      await expect(adapter.close()).resolves.not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Test with invalid config that should fail
      await expect(adapter.init({ baseUrl: '' })).rejects.toThrow()
    })

    it('should handle board URL extraction errors', async () => {
      await adapter.init({})

      const invalidUrls = [
        'https://miro.com/app/board/', // missing board ID
        'https://miro.com/app/board/invalid/', // invalid format
        'https://not-miro.com/app/board/test/', // wrong domain
      ]

      for (const url of invalidUrls) {
        await expect(adapter.initBoard(url)).rejects.toThrow(AdapterError)
      }
    })
  })
})