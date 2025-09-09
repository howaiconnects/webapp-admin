// types/adapter.ts
export interface IAdapterConfig {
  apiKey?: string;
  baseUrl: string;
  authToken?: string; // Supabase JWT propagated
  cacheTtl?: number; // seconds, default 300
  retryAttempts?: number; // default 3
  // Optional runtime flag used by some adapters to prefer cloud mode
  useCloud?: boolean;
}

export class AdapterError extends Error {
  code: string; // e.g., 'AUTH_FAILED', 'RATE_LIMIT'
  details?: any;
  original?: any;

  constructor(message: string, options: { code: string; details?: any; original?: any }) {
    super(message);
    this.code = options.code;
    this.details = options.details;
    this.original = options.original;
  }
}

export interface IAdapter {
  config: IAdapterConfig;

  // Initialize the adapter with config
  init(config: Partial<IAdapterConfig>): Promise<void>;

  // Execute a core operation (platform-specific)
  execute(operation: string, params: any): Promise<any>;

  // List available resources (e.g., prompts, bases, jobs)
  listResources(type: string): Promise<any[]>;

  // Optional convenience: adapters may expose a prompt-specific lister.
  // Kept permissive (any[]) so callers can safely call adapter.listPrompts?.()
  listPrompts?: () => Promise<any[]>;

  // Health check - adapters may return a simple boolean or a structured result like:
  // { ok: boolean; host?: string; latencyMs?: number }
  // Keep optional fields so implementations can return richer diagnostics without breaking consumers.
  healthCheck(): Promise<boolean | { ok: boolean; host?: string; latencyMs?: number }>;

  // Cleanup (e.g., close connections)
  close(): Promise<void>;
}

// Base class implementation
export abstract class BaseAdapter implements IAdapter {
  public config: IAdapterConfig;
  protected cache: Map<string, { data: any; expiry: number }> = new Map(); // Simple in-memory cache; replace with Redis in prod

  constructor(defaultConfig: Partial<IAdapterConfig> = {}) {
    this.config = { baseUrl: '', cacheTtl: 300, retryAttempts: 3, ...defaultConfig };
  }

  async init(config: Partial<IAdapterConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    // Validate config (e.g., required fields)
    if (!this.config.baseUrl) throw new AdapterError('BASE_URL_REQUIRED', { code: 'CONFIG_ERROR' });
    // Setup auth if needed
    await this.setupAuth();
  }

  abstract execute(operation: string, params: any): Promise<any>;
  abstract listResources(type: string): Promise<any[]>;

  /**
   * Optional convenience helper to list prompts. BaseAdapter provides a permissive
   * default that delegates to listResources('prompts') so callers can safely use
   * adapter.listPrompts?.() without type errors.
   */
  async listPrompts(): Promise<any[]> {
    return this.listResources('prompts');
  }

  abstract healthCheck(): Promise<boolean | { ok: boolean }>;
  abstract close(): Promise<void>;

  protected async setupAuth(): Promise<void> {
    // Propagate Supabase JWT to headers
    // Example: this.authToken = await getSupabaseToken();
  }

  // Shared: Caching utility
  protected async getCached(key: string, fetchFn: () => Promise<any>): Promise<any> {
    const cached = this.cache.get(key);
    const now = Date.now();
    if (cached && now < cached.expiry) return cached.data;

    try {
      const data = await fetchFn();
      this.cache.set(key, { data, expiry: now + ((this.config.cacheTtl || 300) * 1000) });
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Shared: Error handling with retry
  protected async withRetry<T>(fn: () => Promise<T>, maxRetries: number = this.config.retryAttempts || 3): Promise<T> {
    let lastError: AdapterError;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as AdapterError;
        if (i === maxRetries || !this.shouldRetry(error)) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
    throw lastError!;
  }

  protected shouldRetry(error: any): boolean {
    return error.code === 'RATE_LIMIT' || error.code === 'NETWORK_ERROR';
  }

  protected handleError(error: any): never {
    const adapterError = new AdapterError(error.message || 'ADAPTER_ERROR', {
      code: error.code || 'UNKNOWN',
      details: error.details,
      original: error
    });
    console.error('[Adapter Error]', adapterError);
    throw adapterError;
  }
}