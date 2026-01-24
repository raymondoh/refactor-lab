/**
 * Rate limiting utility using Upstash Redis
 *
 * Requires the `@upstash/redis` package and the environment variables
 * `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to be set.
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
  }
} catch (error) {
  console.error("Failed to initialize Redis:", error);
}

export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: string;
}

export async function rateLimit(identifier: string): Promise<RateLimitResult> {
  if (!redis) {
    console.warn("Redis is not configured. Rate limiting is disabled.");
    return { success: true };
  }

  const now = Date.now();
  const rate = 5; // Number of allowed requests
  const per = 60 * 1000; // Per minute (in milliseconds)

  try {
    const count = await redis.incr(identifier);
    await redis.expire(identifier, Math.floor(per / 1000));

    if (count === 1) {
      await redis.pexpire(identifier, per);
    }

    const ttl = await redis.pttl(identifier);
    const reset = Math.floor(now + ttl);

    return {
      success: count <= rate,
      limit: rate,
      remaining: Math.max(0, rate - count),
      reset: new Date(reset).toISOString()
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    return { success: true };
  }
}
