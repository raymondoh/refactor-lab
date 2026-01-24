// src/lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

type RatelimitOptions = ConstructorParameters<typeof Ratelimit>[0];

// Upstash's limit signature is: (identifier: string, req?: LimitOptions) => Promise<RatelimitResponse>
interface RateLimiter {
  limit: (identifier: string, req?: Parameters<Ratelimit["limit"]>[1]) => ReturnType<Ratelimit["limit"]>;
}

type RateLimiterConfig = {
  /**
   * If true, errors/misconfigurations cause the limiter to allow requests.
   * If false, errors/misconfigurations cause the limiter to block requests.
   */
  failOpen?: boolean;
  /**
   * Identifier used in logs to distinguish different limiters.
   */
  identifier?: string;
};

// Check if Upstash Redis credentials are provided in environment variables
const missingRedisCredentials = !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN;
logger.info("Upstash env present?", {
  url: !!process.env.UPSTASH_REDIS_REST_URL,
  token: !!process.env.UPSTASH_REDIS_REST_TOKEN
});

// Initialize Redis client only if credentials are provided
const redis = missingRedisCredentials
  ? undefined
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    });

let warnedAboutMissingCredentials = false;

// Function to log a warning if credentials are missing (only once in dev)
const warnMissingCredentials = () => {
  if (warnedAboutMissingCredentials) return;
  warnedAboutMissingCredentials = true;

  if (process.env.NODE_ENV !== "production") {
    logger.warn("Upstash Redis credentials are not set. Falling back to a local no-op rate limiter.");
  }
};

/**
 * Factory function to create a rate limiter.
 *
 * - If Redis is configured, wraps @upstash/ratelimit and catches runtime errors.
 * - If Redis is missing, uses a fallback that either fails open or closed,
 *   depending on `config.failOpen`.
 */
const createRateLimiter = (options: Omit<RatelimitOptions, "redis">, config?: RateLimiterConfig): RateLimiter => {
  const { failOpen = true, identifier = "rate-limiter" } = config ?? {};

  const makeFallbackLimit = (): RateLimiter["limit"] => {
    return async (key: string) => {
      if (failOpen) {
        logger.warn("Rate limiter fallback (fail-open) active", { identifier, key });

        return {
          success: true, // always allow when failing open
          limit: 0,
          remaining: 0,
          reset: Date.now(),
          pending: Promise.resolve()
        };
      } else {
        logger.error("Rate limiter unavailable (fail-closed)", { identifier, key });

        return {
          success: false, // block when failing closed
          limit: 0,
          remaining: 0,
          reset: Date.now(),
          pending: Promise.resolve()
        };
      }
    };
  };

  // If the Redis client was successfully initialized (credentials were present at startup)
  if (redis) {
    const baseLimiter = new Ratelimit({
      ...options,
      redis
    });

    const fallbackLimit = makeFallbackLimit();

    // Wrap the real limiter to catch runtime errors and apply fail-open / fail-closed policy
    const wrappedLimit: RateLimiter["limit"] = async (key, req) => {
      try {
        return await baseLimiter.limit(key, req);
      } catch (error) {
        logger.error("Rate limiter runtime error", { identifier, key, error });
        return fallbackLimit(key, req);
      }
    };

    return { limit: wrappedLimit };
  }

  // If Redis client is undefined (credentials missing at startup), use fallback
  warnMissingCredentials();
  const fallbackLimit = makeFallbackLimit();
  return { limit: fallbackLimit };
};

/**
 * Key helpers
 * - Use IP+email for auth endpoints so you don't lock yourself out on one machine.
 * - Keep keys short + normalized.
 */
export const rateLimitKeys = {
  ipOnly(ip: string) {
    const safeIp = (ip || "unknown").trim();
    return safeIp || "unknown";
  },
  ipEmail(ip: string, email: string) {
    const safeIp = (ip || "unknown").trim() || "unknown";
    const safeEmail = (email || "unknown").trim().toLowerCase() || "unknown";
    return `${safeIp}:${safeEmail}`;
  }
};

/**
 * Auth rate limiters (recommended defaults)
 *
 * These are intentionally more forgiving than your old "5 per 10s" limiter.
 * They still protect against abuse, but won't ruin your own testing.
 *
 * Note: These FAIL CLOSED (block) if Redis is unavailable — same security posture you wanted.
 */

// Login: 10 attempts per 10 minutes per (IP + email)
export const loginRateLimiter = createRateLimiter(
  {
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/auth:login"
  },
  {
    failOpen: false,
    identifier: "auth-login"
  }
);

// Optional backstop: 50 login attempts per 10 minutes per IP (helps against spray attacks)
export const loginIpBackstopRateLimiter = createRateLimiter(
  {
    limiter: Ratelimit.slidingWindow(50, "10 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/auth:login:ip"
  },
  {
    failOpen: false,
    identifier: "auth-login-ip"
  }
);

// Register: 5 per hour per (IP + email)
export const registerRateLimiter = createRateLimiter(
  {
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit/auth:register"
  },
  {
    failOpen: false,
    identifier: "auth-register"
  }
);

// Optional register backstop by IP: 10 per hour per IP
export const registerIpBackstopRateLimiter = createRateLimiter(
  {
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit/auth:register:ip"
  },
  {
    failOpen: false,
    identifier: "auth-register-ip"
  }
);

// Password reset: 5 per hour per (IP + email)
export const passwordResetRateLimiter = createRateLimiter(
  {
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit/auth:reset"
  },
  {
    failOpen: false,
    identifier: "auth-reset"
  }
);

/**
 * General API limiter (unchanged spirit)
 * ✅ FAILS OPEN if Redis is unavailable or errors.
 *
 * Consider widening this too depending on your traffic pattern.
 */
export const standardRateLimiter = createRateLimiter(
  {
    limiter: Ratelimit.slidingWindow(30, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit/standard"
  },
  {
    failOpen: true,
    identifier: "standard"
  }
);
