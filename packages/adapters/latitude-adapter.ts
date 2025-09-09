import { BaseAdapter, IAdapterConfig, AdapterError } from './types/adapter';

/**
 * LatitudeAdapter
 *
 * Supports two modes:
 * - Cloud-first mode (default): uses LATITUDE_CLOUD_* env vars and cloud API surface.
 * - Legacy self-hosted mode: when LATITUDE_USE_CLOUD="false", falls back to LATITUDE_HOST/LATITUDE_SECRET.
 *
 * Env var precedence:
 * - LATITUDE_USE_CLOUD (string "true"|"false", default "true")
 * - When using cloud:
 *   - LATITUDE_CLOUD_BASE_URL (default "https://api.latitude.so")
 *   - LATITUDE_CLOUD_API_KEY (required for cloud mode)
 * - When using legacy:
 *   - LATITUDE_HOST (existing default preserved)
 *   - LATITUDE_SECRET (existing secret preserved)
 *
 * TODO: update /api/prompt to pass `stream` param and use runChatStream where desired.
 */

type RunOpts = {
  supabaseJwt?: string; // passthrough token name used by existing system
  authToken?: string; // optional override
  stream?: boolean;
  [k: string]: any;
};

export class LatitudeAdapter extends BaseAdapter {
  // allow optional flag access on instances (per admin app expectations)
  public useCloud?: boolean;
  public baseUrl: string;

  // Provide a concrete listPrompts implementation (BaseAdapter declares this method non-optional).
  public async listPrompts(): Promise<any[]> {
    try {
      return await this.listResources('prompts');
    } catch (err) {
      // keep permissive typing; return empty array on error to avoid breaking callers
      return [];
    }
  }

  constructor(defaultConfig: Partial<IAdapterConfig> = {}) {
    // Determine default flag from env if not provided in options
    const envUseCloud = (process.env.LATITUDE_USE_CLOUD ?? 'true').toLowerCase() === 'true';
    super({ baseUrl: process.env.LATITUDE_HOST || 'https://latitude.totallybot.com', ...defaultConfig });
    this.useCloud = typeof defaultConfig.useCloud === 'boolean' ? defaultConfig.useCloud : envUseCloud;
    // listPrompts is implemented as a class method (see above). No per-instance assignment required.

    // Set baseUrl according to mode. If using cloud, prefer LATITUDE_CLOUD_BASE_URL.
    this.baseUrl = this.useCloud
      ? (process.env.LATITUDE_CLOUD_BASE_URL || 'https://api.latitude.so')
      : (process.env.LATITUDE_HOST || this.config.baseUrl || 'https://latitude.totallybot.com');

    // Ensure adapter config baseUrl remains consistent with selected host
    this.config.baseUrl = this.baseUrl;
  }

  async init(config: Partial<IAdapterConfig>): Promise<void> {
    await super.init(config);
    // Validate Latitude-specific config
    if (this.useCloud) {
      if (!this.config.apiKey && !process.env.LATITUDE_CLOUD_API_KEY) {
        throw new AdapterError('Latitude cloud API key is required when LATITUDE_USE_CLOUD=true', { code: 'AUTH_CONFIG_MISSING' });
      }
      // If cloud API key provided via env and not in config, copy it for internal use
      if (!this.config.apiKey && process.env.LATITUDE_CLOUD_API_KEY) {
        this.config.apiKey = process.env.LATITUDE_CLOUD_API_KEY;
      }
    } else {
      // legacy behavior: keep supporting LATITUDE_SECRET and LATITUDE_HOST
      if (!this.config.apiKey && !process.env.LATITUDE_SECRET) {
        throw new AdapterError('Latitude API key or secret is required for legacy mode', { code: 'AUTH_CONFIG_MISSING' });
      }
      if (!this.config.apiKey && process.env.LATITUDE_SECRET) {
        this.config.apiKey = process.env.LATITUDE_SECRET;
      }
    }
  }

  /**
   * Build headers used for outgoing requests.
   * - Cloud mode: Authorization: Bearer ${LATITUDE_CLOUD_API_KEY}
   * - Legacy mode: Authorization: ${LATITUDE_SECRET} (keeps previous behavior)
   * - If supabaseJwt or authToken is provided at call time, include x-supabase-jwt header
   */
  private buildHeaders(callOpts: RunOpts = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Add an explicit accept to help streaming endpoints when available
      'Accept': 'application/json',
    };

    // Primary auth header selection
    if (this.useCloud) {
      const key = this.config.apiKey || process.env.LATITUDE_CLOUD_API_KEY || '';
      headers['Authorization'] = `Bearer ${key}`;
    } else {
      // Preserve legacy behavior: previously used Bearer with secret or plain secret.
      const legacyKey = this.config.apiKey || process.env.LATITUDE_SECRET || '';
      // If legacy secret looks like "Bearer ..." already, keep as-is; otherwise use legacy format without "Bearer" prefix to maintain compatibility.
      headers['Authorization'] = legacyKey.startsWith('Bearer ') ? legacyKey : `Bearer ${legacyKey}`;
    }

    // Passthrough Supabase JWT for RBAC/audit. Preserve existing header name used in project: x-supabase-jwt
    const supabaseJwt = callOpts.supabaseJwt || (callOpts as any).authToken;
    if (supabaseJwt) {
      headers['x-supabase-jwt'] = supabaseJwt;
    }

    return headers;
  }

  // Execute a prompt and return the response (non-streaming)
  async runPrompt(promptId: string, params: object = {}, opts: RunOpts = {}): Promise<any> {
    return this.withRetry(async () => {
      const headers = this.buildHeaders(opts);
      const response = await fetch(`${this.baseUrl}/api/v1/prompts/${promptId}/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AdapterError(
          `Latitude API error: ${response.status} ${response.statusText}`,
          {
            code: this.getErrorCode(response.status),
            details: errorData,
            original: response
          }
        );
      }

      return await response.json();
    });
  }

  /**
   * runChatStream
   *
   * Exposes optional streaming behavior. If the cloud supports SSE/streaming, call the stream
   * endpoint and return the Response (or a wrapper). If not supported (or legacy host), fall back
   * to a non-streaming runPrompt and return completed text.
   *
   * Note: We do NOT change other parts of the system to use streaming automatically. This method
   * provides the capability to be adopted when callers update to request streaming.
   */
  async runChatStream(promptId: string, params: object = {}, opts: RunOpts = {}): Promise<any> {
    // If caller didn't request stream, just call runPrompt
    if (!opts.stream) {
      return this.runPrompt(promptId, params, opts);
    }

    // Attempt streaming only in cloud mode; legacy may not support SSE
    if (this.useCloud) {
      const headers = this.buildHeaders(opts);
      // Try cloud streaming endpoint (convention: /stream or ?stream=true). We'll attempt /stream first.
      try {
        const streamUrl = `${this.baseUrl}/api/v1/prompts/${promptId}/stream`;
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          // If streaming endpoint not available or returns non-2xx, fall back to non-stream
          const errorData = await response.text().catch(() => '');
          // Fallback: call runPrompt and return full text response
          return this.runPrompt(promptId, params, opts);
        }

        // If response is a real streaming response (e.g., text/event-stream), return the response to caller
        // so they can consume it. Caller must handle streaming consumption.
        return response;
      } catch (err) {
        // Streaming failed; fallback to non-streaming runPrompt
        return this.runPrompt(promptId, params, opts);
      }
    } else {
      // Legacy: no streaming endpoint known. Fallback to runPrompt
      return this.runPrompt(promptId, params, opts);
    }
  }

  // Required abstract methods from BaseAdapter
  async execute(operation: string, params: any): Promise<any> {
    if (operation === 'runPrompt') {
      const { promptId, ...promptParams } = params;
      return this.runPrompt(promptId, promptParams);
    } else if (operation === 'runChatStream') {
      const { promptId, ...promptParams } = params;
      return this.runChatStream(promptId, promptParams);
    }
    throw new AdapterError(`Operation '${operation}' not supported`, { code: 'UNSUPPORTED_OPERATION' });
  }

  async listResources(type: string): Promise<any[]> {
    return this.withRetry(async () => {
      const headers = this.buildHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/${type}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new AdapterError(
          `Failed to list ${type}: ${response.status}`,
          { code: this.getErrorCode(response.status) }
        );
      }

      const data: any = await response.json();
      return data[type] || [];
    });
  }

  /**
   * healthCheck
   *
   * Calls a lightweight ping endpoint on the chosen host and returns { ok, host, latencyMs? }.
   */
  async healthCheck(): Promise<boolean | { ok: boolean; host?: string; latencyMs?: number }> {
    // Call a lightweight health endpoint and return structured diagnostics when possible.
    const host = this.baseUrl;
    const headers = this.buildHeaders();
    const start = Date.now();
    try {
      const response = await fetch(`${host}/api/v1/health`, {
        method: 'GET',
        headers,
      });
      const latencyMs = Date.now() - start;
      if (response && response.ok) {
        return { ok: true, host, latencyMs };
      }
      return { ok: false, host, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - start;
      return { ok: false, host, latencyMs };
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
      case 429: return 'RATE_LIMIT';
      case 500: return 'SERVER_ERROR';
      default: return 'API_ERROR';
    }
  }
}