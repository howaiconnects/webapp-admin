interface MiroRequest {
  url: string;
  options: RequestInit;
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface BatchOperation {
  // Define batch op structure
}

enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

class RateLimitError extends Error {
  constructor(retryAfter?: string) {
    super(`Rate limit exceeded${retryAfter ? `, retry after ${retryAfter}` : ''}`);
  }
}

class MiroRequestQueue {
  private queue: Map<string, MiroRequest>;
  private processing: Map<string, Promise<any>>;
  private lastRequests: number[] = []; // Moved to class level for rate limiting
  private rateLimiter: { acquire: () => Promise<void> };

  constructor() {
    this.queue = new Map();
    this.processing = new Map();
    this.rateLimiter = {
      async acquire() {
        const now = Date.now();
        this.lastRequests = this.lastRequests.filter((time: number) => time > now - 60000); // 1 min window, typed parameter
        while (this.lastRequests.length >= 50) { // Max 50/min
          await new Promise(resolve => setTimeout(resolve, 1000));
          const updatedNow = Date.now();
          this.lastRequests = this.lastRequests.filter((time: number) => time > updatedNow - 60000); // Typed
        }
        this.lastRequests.push(now);
      }
    };
  }
  
  async execute<T>(request: MiroRequest): Promise<T> {
    // Deduplication
    const requestKey = this.getRequestKey(request);
    if (this.processing.has(requestKey)) {
      return this.processing.get(requestKey)! as T;
    }
    
    const promise = this.processRequest<T>(request);
    this.processing.set(requestKey, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.processing.delete(requestKey);
    }
  }
  
  private async processRequest<T>(request: MiroRequest): Promise<T> {
    // Wait for rate limit
    await this.rateLimiter.acquire();
    
    // Exponential backoff retry
    return this.withExponentialBackoff(async () => {
      const response = await fetch(request.url, {
        ...request.options,
        headers: {
          ...request.options.headers,
          'X-Request-Id': request.id,
        }
      });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter ?? undefined); // Handle null as undefined
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json() as T;
    });
  }
  
  // Batch multiple operations
  async batchExecute(operations: BatchOperation[]): Promise<any[]> {
    const batches = this.groupIntoBatches(operations, 10); // Max 10 per batch
    
    return Promise.all(
      batches.map(batch => 
        this.execute({
          url: 'https://api.miro.com/v2/batch',
          options: {
            method: 'POST',
            body: JSON.stringify({ operations: batch })
          },
          id: `batch-${Date.now()}`,
          priority: Priority.HIGH
        })
      )
    );
  }

  private async withExponentialBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    throw lastError!;
  }

  private getRequestKey(request: MiroRequest): string {
    return `${request.url}:${JSON.stringify(request.options.body || {})}`;
  }

  private groupIntoBatches(operations: BatchOperation[], size: number): BatchOperation[][] {
    const batches: BatchOperation[][] = [];
    for (let i = 0; i < operations.length; i += size) {
      batches.push(operations.slice(i, i + size));
    }
    return batches;
  }
}

export { MiroRequestQueue, Priority, RateLimitError };
