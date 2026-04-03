import { Queue } from 'bullmq';
import env from './env.js';
import { logInfo, logError } from '../logs/logger.js';
import { isRedisAvailable } from './redis.js';

const connection = {
  host: env.REDIS_URL ? new URL(env.REDIS_URL).hostname : '127.0.0.1',
  port: env.REDIS_URL ? new URL(env.REDIS_URL).port : 6379,
  maxRetriesPerRequest: null, // Critical: Stop BullMQ from crashing the process on Redis failure
};

// Main email queue — Initially null
export let emailQueue = null;

// Function to initialize the queue ONLY if Redis is confirmed online
export const initQueue = () => {
  if (!isRedisAvailable || !env.REDIS_URL) {
    logInfo('REDIS_URL not set or offline — BullMQ Queue is dormant');
    return null;
  }
  
  try {
    emailQueue = new Queue('emailQueue', { 
      connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      }
    });
    logInfo('BullMQ Email Queue initialized successfully');
    return emailQueue;
  } catch (err) {
    logError('Failed to initialize BullMQ Queue: Connection refused.');
    return null;
  }
};

// Function to add jobs to the queue — with failsafe
export const addEmailJob = async (type, data) => {
  if (!emailQueue) {
    logInfo(`[OFFLINE] Email job ${type} for ${data.to} skipped (Redis down).`);
    return;
  }
  
  try {
    await emailQueue.add(type, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  } catch (err) {
    logError(`Queue add job failed: ${err.message}`);
  }
};
