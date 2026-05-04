import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const entryProcessingQueue = new Queue('entry-processing', { connection });
export const digestQueue = new Queue('digest', { connection });
