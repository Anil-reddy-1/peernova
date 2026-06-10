import type { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { RateLimitError } from '../lib/errors';
import { logger } from '../lib/pino';

function createLimiter(keyPrefix: string, points: number, duration: number, blockDuration: number) {


  // Fallback to in-memory rate limiter when Redis is unavailable
  logger.warn(`Using in-memory rate limiter for ${keyPrefix} (Redis unavailable)`);
  return new RateLimiterMemory({
    keyPrefix,
    points,
    duration,
    blockDuration,
  });
}

const authLimiter = createLimiter('rl:auth', 10, 15 * 60, 15 * 60);
const apiLimiter = createLimiter('rl:api', 100, 60, 0);
const uploadLimiter = createLimiter('rl:upload', 20, 60 * 60, 60 * 60);

const limiters = {
  auth: authLimiter,
  api: apiLimiter,
  upload: uploadLimiter,
} as const;

export function createRateLimiter(type: 'auth' | 'api' | 'upload') {
  const limiter = limiters[type];

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.user?.uid ?? req.ip ?? 'anonymous';

    try {
      const result = await limiter.consume(key);
      res.setHeader('X-RateLimit-Remaining', String(result.remainingPoints));
      res.setHeader(
        'Retry-After',
        String(Math.ceil(result.msBeforeNext / 1000)),
      );
      next();
    } catch (rateLimiterRes) {
      if (
        rateLimiterRes &&
        typeof rateLimiterRes === 'object' &&
        'msBeforeNext' in rateLimiterRes
      ) {
        const rlRes = rateLimiterRes as { msBeforeNext: number; remainingPoints: number };
        const retryAfter = Math.ceil(rlRes.msBeforeNext / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        res.setHeader('X-RateLimit-Remaining', '0');
        throw new RateLimitError(retryAfter);
      }
      next(rateLimiterRes);
    }
  };
}
