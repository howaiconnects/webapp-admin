import { BaseAdapter, IAdapterConfig, AdapterError } from './types/adapter';

export class AIContentLabsAdapter extends BaseAdapter {
  constructor(defaultConfig: Partial<IAdapterConfig> = {}) {
    super({ baseUrl: process.env.AICONTENTLABS_BASE_URL || 'https://api.aicontentlabs.com', ...defaultConfig });
  }

  async init(config: Partial<IAdapterConfig>): Promise<void> {
    await super.init(config);
    // Validate AIContentLabs-specific config
    if (!this.config.apiKey && !process.env.AICONTENTLABS_API_KEY) {
      throw new AdapterError('AIContentLabs API key is required', { code: 'AUTH_CONFIG_MISSING' });
    }
  }

  // Generate content using AIContentLabs API
  async generateContent(prompt: string, options: { type?: string; length?: number } = {}): Promise<any> {
    return this.withRetry(async () => {
      const key = `aicontentlabs:generate:${prompt.substring(0, 50)}`;
      return this.getCached(key, async () => {
        // Mock implementation - replace with actual API call when available
        console.log('AIContentLabs: Generating content for prompt:', prompt);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return mock generated content
        return {
          content: `This is a sample blog post about "${prompt}". AIContentLabs would generate unlimited content here with advanced AI capabilities.`,
          type: options.type || 'blog',
          length: options.length || 500,
          generatedAt: new Date().toISOString(),
          metadata: {
            wordCount: 150,
            readingTime: '1 min',
            seoScore: 85
          }
        };
      });
    });
  }

  // Required abstract methods from BaseAdapter
  async execute(operation: string, params: any): Promise<any> {
    if (operation === 'generateContent') {
      const { prompt, ...options } = params;
      if (!prompt) {
        throw new AdapterError('prompt is required for generateContent', { code: 'INVALID_PARAMS' });
      }
      return this.generateContent(prompt, options);
    }
    throw new AdapterError(`Operation '${operation}' not supported`, { code: 'UNSUPPORTED_OPERATION' });
  }

  async listResources(type: string): Promise<any[]> {
    // For MVP, return empty array as AIContentLabs resources are accessed via API calls
    return [];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to access a known endpoint or just check API key presence
      return !!(this.config.apiKey || process.env.AICONTENTLABS_API_KEY);
    } catch (error) {
      console.warn('AIContentLabs health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    // No persistent connections to close for HTTP-based API
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 401: return 'AUTH_FAILED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 422: return 'INVALID_REQUEST';
      case 429: return 'RATE_LIMIT';
      case 500: return 'SERVER_ERROR';
      default: return 'API_ERROR';
    }
  }
}