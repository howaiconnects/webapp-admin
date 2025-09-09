interface PerformanceMetrics {
  apiResponseTime: { p50: number; p95: number; p99: number };
  cacheHitRate: { l1: number; l2: number; cdn: number };
  webhookProcessing: { avgLatency: number; throughput: number; errorRate: number };
  resourceUsage: { cpu: number; memory: number; connections: number };
}

class MiroMetrics {
  private metrics: PerformanceMetrics = {
    apiResponseTime: { p50: 0, p95: 0, p99: 0 },
    cacheHitRate: { l1: 0, l2: 0, cdn: 0 },
    webhookProcessing: { avgLatency: 0, throughput: 0, errorRate: 0 },
    resourceUsage: { cpu: 0, memory: 0, connections: 0 },
  };
  private apiTimes: number[] = []; // For percentiles
  private cacheHits: { l1: number; l2: number; cdn: number } = { l1: 0, l2: 0, cdn: 0 };
  private cacheRequests: number = 0;

  recordApiResponseTime(duration: number): void {
    this.apiTimes.push(duration);
    if (this.apiTimes.length > 1000) { // Keep last 1000 for percentiles
      this.apiTimes.shift();
    }
    this.updateApiPercentiles();
  }

  private updateApiPercentiles(): void {
    if (this.apiTimes.length === 0) return;
    this.apiTimes.sort((a, b) => a - b);
    const n = this.apiTimes.length;
    this.metrics.apiResponseTime.p50 = this.apiTimes[Math.floor(n * 0.5)];
    this.metrics.apiResponseTime.p95 = this.apiTimes[Math.floor(n * 0.95)];
    this.metrics.apiResponseTime.p99 = this.apiTimes[Math.floor(n * 0.99)];
  }

  recordCacheHit(layer: 'l1' | 'l2' | 'cdn'): void {
    this.cacheHits[layer]++;
    this.cacheRequests++;
    this.updateCacheHitRates();
  }

  private updateCacheHitRates(): void {
    this.metrics.cacheHitRate.l1 = this.cacheRequests > 0 ? (this.cacheHits.l1 / this.cacheRequests) * 100 : 0;
    this.metrics.cacheHitRate.l2 = this.cacheRequests > 0 ? (this.cacheHits.l2 / this.cacheRequests) * 100 : 0;
    this.metrics.cacheHitRate.cdn = this.cacheRequests > 0 ? (this.cacheHits.cdn / this.cacheRequests) * 100 : 0;
  }

  recordCacheMiss(): void {
    this.cacheRequests++;
    this.updateCacheHitRates();
  }

  recordWebhookLatency(latency: number): void {
    this.metrics.webhookProcessing.avgLatency = (this.metrics.webhookProcessing.avgLatency + latency) / 2; // Simple average
    this.metrics.webhookProcessing.throughput = Date.now(); // Placeholder for rate
  }

  recordWebhookError(): void {
    this.metrics.webhookProcessing.errorRate += 1;
  }

  updateResourceUsage(cpu: number, memory: number, connections: number): void {
    this.metrics.resourceUsage.cpu = cpu;
    this.metrics.resourceUsage.memory = memory;
    this.metrics.resourceUsage.connections = connections;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Log to external system - placeholder
  logMetrics(): void {
    console.log('Miro Metrics:', this.metrics);
    // e.g., await supabase.from('metrics').insert({ data: this.metrics });
  }
}

export { MiroMetrics, PerformanceMetrics };