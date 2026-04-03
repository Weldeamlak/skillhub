import { createClient } from 'redis';
import env from './env.js';

// Only create/connect to Redis when REDIS_URL is explicitly set.
const redisUrl = env.REDIS_URL || null;

export let redisClient = null;

if (redisUrl) {
  redisClient = createClient({
    url: redisUrl,
    socket: {
      // ✅ Fail fast on startup if Redis is down so MongoDB can connect
      reconnectStrategy: (retries) => {
        if (retries > 0) {
          return new Error('Redis connection failed');
        }
        return 500; // retry once after 500ms
      },
    },
  });

  redisClient.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      if (!global.redisConnRefusedLogged) {
        console.warn('[REDIS] Connection refused. Rate limiting will fallback to in-memory storage.');
        global.redisConnRefusedLogged = true;
      }
    } else {
      console.error('Redis Client Error:', err);
    }
  });
}

export let isRedisAvailable = false;

export async function connectRedis() {
  if (!redisClient) {
    console.log('[REDIS] REDIS_URL not set — skipping connection');
    return false;
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('[REDIS] Connected successfully');
      isRedisAvailable = true;
      return true;
    }
    return true;
  } catch (err) {
    console.warn('[REDIS] Offline — background jobs and caching disabled.');
    isRedisAvailable = false;
    return false;
  }
}

export default redisClient;
