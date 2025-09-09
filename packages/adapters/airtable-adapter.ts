import { BaseAdapter, IAdapterConfig, AdapterError } from './types/adapter';

export class AirtableAdapter extends BaseAdapter {
  constructor(defaultConfig: Partial<IAdapterConfig> = {}) {
    super({ baseUrl: 'https://api.airtable.com/v0', ...defaultConfig });
  }

  async init(config: Partial<IAdapterConfig>): Promise<void> {
    await super.init(config);
    // Validate Airtable-specific config
    if (!this.config.apiKey && !process.env.AIRTABLE_API_KEY) {
      throw new AdapterError('Airtable API key is required', { code: 'AUTH_CONFIG_MISSING' });
    }
  }

  // List records from a specific base and table
  async listRecords(baseId: string, table: string): Promise<any[]> {
    return this.withRetry(async () => {
      const key = `airtable:listRecords:${baseId}:${table}`;
      return this.getCached(key, async () => {
        const response = await fetch(`${this.config.baseUrl}/v0/${baseId}/${table}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey || process.env.AIRTABLE_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new AdapterError(
            `Airtable API error: ${response.status} ${response.statusText}`,
            {
              code: this.getErrorCode(response.status),
              details: errorData,
              original: response
            }
          );
        }

        const data = await response.json() as { records?: any[] };
        return data.records || [];
      });
    });
  }

  // Required abstract methods from BaseAdapter
  async execute(operation: string, params: any): Promise<any> {
    if (operation === 'listRecords') {
      const { baseId, table } = params;
      if (!baseId || !table) {
        throw new AdapterError('baseId and table are required for listRecords', { code: 'INVALID_PARAMS' });
      }
      return this.listRecords(baseId, table);
    }
    throw new AdapterError(`Operation '${operation}' not supported`, { code: 'UNSUPPORTED_OPERATION' });
  }

  async listResources(): Promise<any[]> {
    // For MVP, return empty array as Airtable resources are accessed via baseId/table
    return [];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to access a known endpoint or just check API key presence
      return !!(this.config.apiKey || process.env.AIRTABLE_API_KEY);
    } catch (error) {
      console.warn('Airtable health check failed:', error);
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