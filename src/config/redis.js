import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

// Only create/connect to Redis when REDIS_URL is explicitly set.
const redisUrl = process.env.REDIS_URL || null;

export let redisClient = null;

if (redisUrl) {
  redisClient = createClient({ url: redisUrl });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });
}

export async function connectRedis() {
  if (!redisClient) {
    console.log('REDIS_URL not set — skipping Redis connection');
    return;
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Connected to Redis');
    }
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message || err);
  }
}

export default redisClient;
