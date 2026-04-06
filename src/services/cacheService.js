import redisClient, { isRedisReady } from "../config/redis.js";
import { logInfo, logError } from "../logs/logger.js";

/**
 * Get a value from Redis
 */
export const getCache = async (key) => {
  if (!isRedisReady()) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logError(`Redis Get Error [${key}]: ${error.message}`);
    return null;
  }
};

/**
 * Set a value in Redis with TTL (Time To Live)
 */
export const setCache = async (key, value, ttlSeconds = 600) => {
  if (!isRedisReady()) return;

  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (error) {
    logError(`Redis Set Error [${key}]: ${error.message}`);
  }
};

/**
 * Delete a value from Redis (Invalidate)
 */
export const delCache = async (key) => {
  if (!isRedisReady()) return;

  try {
    await redisClient.del(key);
    logInfo(`Cache Invalidated: ${key}`);
  } catch (error) {
    logError(`Redis Del Error [${key}]: ${error.message}`);
  }
};

/**
 * Bulk delete keys matching a pattern (e.g., courses:*)
 */
export const delCachePattern = async (pattern) => {
  if (!isRedisReady()) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logInfo(`Cache Pattern Invalidated: ${pattern} (${keys.length} keys)`);
    }
  } catch (error) {
    logError(`Redis Pattern Del Error [${pattern}]: ${error.message}`);
  }
};
