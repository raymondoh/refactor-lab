// src/lib/rateLimit.ts
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

type RateLimitOptions = {
  limit?: number; // allowed requests
  windowMs?: number; // time window in ms
  failOpen?: boolean; // if Redis errors, allow (true) or block (false)
};

export async function rateLimit(identifier: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
  const { limit = 5, windowMs = 60 * 1000, failOpen = true } = options;

  if (!redis) {
    console.warn("Redis is not configured. Rate limiting is disabled.");
    return { success: failOpen, limit, remaining: 0 };
  }

  const now = Date.now();

  try {
    // Use a window-specific key so different windows don't collide
    const key = `${identifier}:${Math.floor(now / windowMs)}`;

    const count = await redis.incr(key);

    // Ensure expiry is set
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }

    const ttl = await redis.pttl(key);
    const reset = now + Math.max(0, ttl);

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset: new Date(reset).toISOString()
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    return { success: failOpen, limit, remaining: 0 };
  }
}
export const rateLimitKeys = {
  ipOnly(ip: string) {
    return (ip || "unknown").trim() || "unknown";
  },
  ipEmail(ip: string, email: string) {
    const safeIp = (ip || "unknown").trim() || "unknown";
    const safeEmail = (email || "unknown").trim().toLowerCase() || "unknown";
    return `${safeIp}:${safeEmail}`;
  }
};
