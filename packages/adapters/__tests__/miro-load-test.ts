import { MiroAIAdapter } from '../miro-ai-adapter.ts';
import { MiroMetrics } from '../miro-metrics.ts';
import { MiroRequestQueue } from '../miro-request-queue.ts';

const adapter = new MiroAIAdapter({
  baseUrl: 'https://api.miro.com', // Mock for test
  clientId: 'test', // Placeholder
  clientSecret: 'test',
});

const metrics = new MiroMetrics();
const queue = new MiroRequestQueue();

async function loadTest() {
  const start = Date.now();
  const promises: Promise<void>[] = [];

  for (let i = 0; i < 100; i++) {
    promises.push(
      queue.execute({
        url: 'https://api.miro.com/v1/boards', // Mock endpoint
        options: {
          method: 'GET',
        },
        id: `test-${i}`,
        priority: 'HIGH',
      }).then((result) => {
        const duration = Date.now() - start;
        metrics.recordApiResponseTime(duration);
        console.log(`Request ${i} completed in ${duration}ms`);
      }).catch((error) => {
        console.error(`Request ${i} failed:`, error);
        metrics.recordApiResponseTime(Date.now() - start);
      })
    );
  }

  await Promise.all(promises);
  const totalDuration = Date.now() - start;
  console.log(`Load test completed in ${totalDuration}ms`);
  console.log('Metrics:', metrics.getMetrics());
}

loadTest().catch(console.error);
