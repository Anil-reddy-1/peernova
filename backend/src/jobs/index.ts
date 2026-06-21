import { logger } from '../lib/pino';

// Simple mock queue to replace BullMQ for simplicity
class MockQueue {
  constructor(private name: string) {}
  async add(name: string, data: any) {
    logger.info({ queueName: this.name, jobName: name, data }, 'Mock queue received job (executing synchronously or dropping)');
    // In a real simplified app, you might execute logic here synchronously or in a setTimeout
  }
}

export const emailQueue = new MockQueue('emailQueue');
export const notificationQueue = new MockQueue('notificationQueue');
export const walletReleaseQueue = new MockQueue('walletReleaseQueue');
