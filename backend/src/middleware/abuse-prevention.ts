import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/pino';

// 100 requests per minute per IP for standard routes
const standardLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

// 10 requests per 15 minutes for auth/sensitive routes
const strictLimiter = new RateLimiterMemory({
  points: 10,
  duration: 900, // 15 minutes
});

export const rateLimitMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  standardLimiter
    .consume(ip)
    .then(() => next())
    .catch(() => {
      logger.warn({ ip, path: req.path }, 'Rate limit exceeded');
      next(new Error('Too Many Requests')); // We can swap with a custom error class if needed
    });
};

export const strictRateLimitMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  strictLimiter
    .consume(ip)
    .then(() => next())
    .catch(() => {
      logger.warn({ ip, path: req.path }, 'Strict rate limit exceeded');
      next(new Error('Too Many Requests'));
    });
};
