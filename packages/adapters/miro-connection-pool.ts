import { Agent } from 'http';
import { fetch } from 'undici'; // Assume undici for pooled fetch, or use node-fetch with agent

interface PooledRequestOptions extends RequestInit {
  url: string;
  timeout?: number;
}

class MiroConnectionPool {
  private agent: Agent;
  private maxSockets: number;
  private timeout: number;

  constructor(maxSockets = 20, timeout = 30000) {
    this.maxSockets = maxSockets;
    this.timeout = timeout;
    this.agent = new Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: this.maxSockets,
      timeout: this.timeout,
      freeSocketTimeout: 90000, // Close free sockets after 90s
    });
  }

  async makeRequest<T>(options: PooledRequestOptions): Promise<T> {
    const { url, timeout = this.timeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        dispatcher: this.agent,
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json() as T;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  // Close all connections
  close(): void {
    this.agent.destroy();
  }

  // Get pool stats - placeholder
  getStats(): { activeSockets: number; freeSockets: number } {
    return {
      activeSockets: this.agent.sockets.length,
      freeSockets: this.agent.freeSockets.length,
    };
  }
}

export { MiroConnectionPool };