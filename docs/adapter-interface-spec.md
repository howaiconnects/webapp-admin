# Adapter Interface Specification

This document defines the standard interface for all adapters in the How AI Connects platform. Adapters connect the WowDash frontend/backend to external platforms (Latitude.so, Airtable, Bright Data, Crawl4ai). All adapters must implement this base interface for consistency, modularity, and ease of maintenance. The spec is written in TypeScript for type safety in the Node.js/Express backend.

## Base Adapter Interface

All adapters extend a `BaseAdapter` class or implement the `IAdapter` interface. This ensures common functionality like initialization, authentication, and error handling.

### TypeScript Interface

```typescript
// types/adapter.ts
export interface IAdapterConfig {
  apiKey?: string;
  baseUrl: string;
  authToken?: string; // Supabase JWT propagated
  cacheTtl?: number; // seconds, default 300
  retryAttempts?: number; // default 3
}

export interface AdapterError extends Error {
  code: string; // e.g., 'AUTH_FAILED', 'RATE_LIMIT'
  details?: any;
}

export interface IAdapter {
  config: IAdapterConfig;

  // Initialize the adapter with config
  init(config: Partial<IAdapterConfig>): Promise<void>;

  // Execute a core operation (platform-specific)
  execute(operation: string, params: any): Promise<any>;

  // List available resources (e.g., prompts, bases, jobs)
  listResources(type: string): Promise<any[]>;

  // Health check
  healthCheck(): Promise<boolean>;

  // Cleanup (e.g., close connections)
  close(): Promise<void>;
}

// Base class implementation
abstract class BaseAdapter implements IAdapter {
  protected config: IAdapterConfig;
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
  abstract healthCheck(): Promise<boolean>;
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
      this.cache.set(key, { data, expiry: now + (this.config.cacheTtl * 1000) });
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Shared: Error handling with retry
  protected async withRetry<T>(fn: () => Promise<T>, maxRetries: number = this.config.retryAttempts): Promise<T> {
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
```

### Usage Example

For a concrete adapter (e.g., LatitudeAdapter):

```typescript
// adapters/latitude-adapter.ts
import { BaseAdapter, IAdapterConfig } from '../types/adapter';

export class LatitudeAdapter extends BaseAdapter {
  async execute(operation: 'runPrompt' | 'createAgent', params: any): Promise<any> {
    return this.withRetry(async () => {
      const key = `latitude:${operation}:${JSON.stringify(params)}`;
      return this.getCached(key, async () => {
        const response = await fetch(`${this.config.baseUrl}/api/${operation}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.config.authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      });
    });
  }

  async listResources(type: 'prompts' | 'agents'): Promise<any[]> {
    // Implementation with caching and retry
  }

  // ... other abstract methods
}
```

## Shared Patterns

### 1. Error Handling
- **Custom Errors:** Extend `AdapterError` with platform-specific codes (e.g., 'LATITUDE_PROMPT_INVALID').
- **Retry Logic:** Use `withRetry` for transient errors (rate limits, networks). Exponential backoff.
- **Logging:** Console.error with details; integrate with Supabase logs in prod.
- **User-Facing:** In WowDash UI, catch and display friendly messages (e.g., via toast notifications).

### 2. Caching
- **In-Memory Default:** Simple Map with TTL; key by operation + params hash.
- **Redis Integration:** Replace Map with Redis client for distributed caching.
  ```typescript
  // Example Redis setup in init()
  this.redis = new Redis({ url: process.env.REDIS_URL });
  // In getCached: await this.redis.get(key) ?? await fetchFn() && await this.redis.set(key, JSON.stringify(data), 'EX', this.config.cacheTtl)
  ```
- **Invalidation:** Manual on mutations (e.g., createPrompt invalidates list prompts cache).
- **Scope:** Cache responses from external APIs to reduce calls; user-specific via JWT.

### 3. Authentication
- **Supabase JWT Propagation:** All requests include `Authorization: Bearer ${supabaseToken}` header.
- **OAuth/API Keys:** Configurable per adapter; refresh tokens if needed.
- **RBAC Enforcement:** Before execute/list, check Supabase roles (e.g., admin for scraping jobs).
- **Secure Storage:** Use Supabase secrets or env vars for keys; never hardcode.

### Guidelines for Implementation
- **Modularity:** Each adapter in `packages/adapters/` with its own folder (e.g., latitude/).
- **Testing:** Unit tests for execute/list; mock external APIs.
- **Versioning:** Support multiple API versions via config.
- **Monitoring:** Log metrics (success rate, latency) to Supabase or Prometheus.

This spec ensures adapters are interchangeable and robust, aligning with the architecture diagram.