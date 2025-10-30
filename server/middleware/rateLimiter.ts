/**
 * Rate Limiting Middleware
 * Prevents brute-force attacks on authentication and sensitive endpoints
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 600000);

/**
 * Rate limit configuration profiles
 */
export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many requests. Please slow down.',
  },
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many attempts. Please try again later.',
  },
  generous: {
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute
    message: 'Rate limit exceeded. Please wait a moment.',
  },
};

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get identifier (IP + endpoint by default)
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : `${req.ip}-${req.path}`;

    const now = Date.now();
    const record = store[key];

    // Initialize or reset if window expired
    if (!record || record.resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return next();
    }

    // Increment counter
    record.count++;

    // Check if limit exceeded
    if (record.count > config.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', config.max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', record.resetTime.toString());
      res.setHeader('Retry-After', retryAfter.toString());

      return res.status(429).json({
        success: false,
        error: config.message,
        retryAfter,
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max.toString());
    res.setHeader('X-RateLimit-Remaining', (config.max - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };
}

/**
 * Pre-configured rate limiters
 */

// Authentication endpoints (login, signup, password reset)
export const authRateLimiter = createRateLimiter({
  ...RATE_LIMITS.auth,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination
    const email = req.body.email || 'unknown';
    return `auth-${req.ip}-${email}`;
  },
});

// General API endpoints
export const apiRateLimiter = createRateLimiter(RATE_LIMITS.api);

// Strict rate limiting for sensitive operations
export const strictRateLimiter = createRateLimiter({
  ...RATE_LIMITS.strict,
  keyGenerator: (req) => `strict-${req.ip}-${req.path}`,
});

// Generous rate limiting for read-only endpoints
export const generousRateLimiter = createRateLimiter(RATE_LIMITS.generous);

/**
 * Middleware to check if IP is rate limited
 */
export function isRateLimited(req: Request): boolean {
  const key = `${req.ip}-${req.path}`;
  const record = store[key];
  
  if (!record) return false;
  
  const now = Date.now();
  if (record.resetTime < now) return false;
  
  return record.count > RATE_LIMITS.api.max;
}

/**
 * Clear rate limit for a specific key (e.g., after successful auth)
 */
export function clearRateLimit(key: string): void {
  delete store[key];
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus(key: string): {
  count: number;
  resetTime: number;
  remaining: number;
} | null {
  const record = store[key];
  if (!record) return null;
  
  const now = Date.now();
  if (record.resetTime < now) return null;
  
  return {
    count: record.count,
    resetTime: record.resetTime,
    remaining: Math.max(0, RATE_LIMITS.api.max - record.count),
  };
}

