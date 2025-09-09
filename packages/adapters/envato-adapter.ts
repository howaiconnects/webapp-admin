import { BaseAdapter, IAdapterConfig, AdapterError } from './types/adapter';

export class EnvatoAdapter extends BaseAdapter {
  constructor(defaultConfig: Partial<IAdapterConfig> = {}) {
    super({ baseUrl: process.env.ENVATO_BASE_URL || 'https://api.envato.com', ...defaultConfig });
  }

  async init(config: Partial<IAdapterConfig>): Promise<void> {
    await super.init(config);
    // Validate Envato-specific config
    if (!this.config.apiKey && !process.env.ENVATO_API_KEY) {
      throw new AdapterError('Envato API key is required', { code: 'AUTH_CONFIG_MISSING' });
    }
  }

  // Search for media assets using Envato Elements API
  async searchMedia(query: string, options: { type?: string; limit?: number } = {}): Promise<any[]> {
    return this.withRetry(async () => {
      const key = `envato:search:${query}:${options.type || 'all'}`;
      return this.getCached(key, async () => {
        // Mock implementation - replace with actual API call when available
        console.log('Envato: Searching media for query:', query);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Return mock media results
        const mockResults = [
          {
            id: '1',
            title: 'Business Presentation Template',
            type: 'video',
            url: 'https://via.placeholder.com/640x360?text=Business+Template',
            thumbnail: 'https://via.placeholder.com/320x180?text=Business+Template',
            tags: ['business', 'presentation', 'corporate'],
            downloadUrl: 'https://via.placeholder.com/640x360?text=Business+Template'
          },
          {
            id: '2',
            title: 'Technology Background Image',
            type: 'image',
            url: 'https://via.placeholder.com/1920x1080?text=Tech+Background',
            thumbnail: 'https://via.placeholder.com/400x225?text=Tech+Background',
            tags: ['technology', 'background', 'digital'],
            downloadUrl: 'https://via.placeholder.com/1920x1080?text=Tech+Background'
          },
          {
            id: '3',
            title: 'Product Showcase Video',
            type: 'video',
            url: 'https://via.placeholder.com/1280x720?text=Product+Showcase',
            thumbnail: 'https://via.placeholder.com/320x180?text=Product+Showcase',
            tags: ['product', 'showcase', 'marketing'],
            downloadUrl: 'https://via.placeholder.com/1280x720?text=Product+Showcase'
          }
        ];

        return mockResults.slice(0, options.limit || 10);
      });
    });
  }

  // Get media details by ID
  async getMediaDetails(mediaId: string): Promise<any> {
    return this.withRetry(async () => {
      const key = `envato:media:${mediaId}`;
      return this.getCached(key, async () => {
        // Mock implementation
        console.log('Envato: Getting media details for ID:', mediaId);

        await new Promise(resolve => setTimeout(resolve, 500));

        return {
          id: mediaId,
          title: 'Sample Media Asset',
          type: 'image',
          description: 'High-quality media asset from Envato Elements',
          url: 'https://via.placeholder.com/800x600?text=Media+Asset',
          thumbnail: 'https://via.placeholder.com/400x300?text=Media+Asset',
          tags: ['sample', 'media', 'asset'],
          license: 'unlimited',
          downloadUrl: 'https://via.placeholder.com/800x600?text=Media+Asset'
        };
      });
    });
  }

  // Required abstract methods from BaseAdapter
  async execute(operation: string, params: any): Promise<any> {
    if (operation === 'searchMedia') {
      const { query, ...options } = params;
      if (!query) {
        throw new AdapterError('query is required for searchMedia', { code: 'INVALID_PARAMS' });
      }
      return this.searchMedia(query, options);
    }
    if (operation === 'getMediaDetails') {
      const { mediaId } = params;
      if (!mediaId) {
        throw new AdapterError('mediaId is required for getMediaDetails', { code: 'INVALID_PARAMS' });
      }
      return this.getMediaDetails(mediaId);
    }
    throw new AdapterError(`Operation '${operation}' not supported`, { code: 'UNSUPPORTED_OPERATION' });
  }

  async listResources(type: string): Promise<any[]> {
    // For MVP, return empty array as Envato resources are accessed via API calls
    return [];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to access a known endpoint or just check API key presence
      return !!(this.config.apiKey || process.env.ENVATO_API_KEY);
    } catch (error) {
      console.warn('Envato health check failed:', error);
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