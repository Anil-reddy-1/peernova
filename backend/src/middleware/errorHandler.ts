import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types/shared';
import { ZodError } from 'zod';
import { AppError, RateLimitError } from '../lib/errors';
import { logger } from '../lib/pino';

const isProduction = process.env.NODE_ENV === 'production';

function isFirebaseAuthError(err: unknown): err is Error & { code: string } {
  if (!(err instanceof Error)) return false;
  const errWithCode = err as Error & { code?: string };
  return (
    typeof errWithCode.code === 'string' &&
    errWithCode.code.startsWith('auth/')
  );
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId ?? 'unknown';

  if (err instanceof AppError) {
    logger.warn(
      {
        requestId,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        ...(!isProduction && { stack: err.stack }),
      },
      `AppError: ${err.message}`,
    );

    if (err instanceof RateLimitError) {
      res.setHeader('Retry-After', String(err.retryAfter));
    }

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      },
      meta: null,
    };

    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    }

    logger.warn(
      { requestId, details },
      'Zod validation error',
    );

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
      meta: null,
    };

    res.status(422).json(response);
    return;
  }

  if (isFirebaseAuthError(err)) {
    logger.warn(
      { requestId, code: (err as Error & { code: string }).code, message: err.message },
      'Firebase auth error',
    );

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
        details: null,
      },
      meta: null,
    };

    res.status(401).json(response);
    return;
  }

  logger.error(
    {
      requestId,
      err,
      message: err.message,
      ...(!isProduction && { stack: err.stack }),
    },
    `Unhandled error: ${err.message}`,
  );

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      details: null,
    },
    meta: null,
  };

  res.status(500).json(response);
}
