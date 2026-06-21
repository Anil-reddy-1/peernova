import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types/shared';
import { getAuth } from '../lib/firebase-admin';
import { logger } from '../lib/pino';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
          details: null,
        },
        meta: null,
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.slice(7);

    if (!token) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token format',
          details: null,
        },
        meta: null,
      };
      res.status(401).json(response);
      return;
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user info to request (matches reference auth pattern)
    req.user = {
      uid: decodedToken.uid,
      name: decodedToken.name,
      email: decodedToken.email,
      picture: decodedToken.picture,
      phoneNumber: decodedToken.phone_number,
      emailVerified: decodedToken.email_verified,
      role: (decodedToken.role as string) ?? undefined,
      customClaims: decodedToken,
    };

    logger.debug({ uid: req.user.uid, email: req.user.email }, 'User authenticated');
    next();
  } catch (err) {
    // Firebase specific errors
    const firebaseErr = err as { code?: string };
    if (firebaseErr.code?.startsWith('auth/')) {
      logger.warn({ requestId: req.requestId, code: firebaseErr.code }, 'Firebase auth error');
    } else {
      logger.warn({ requestId: req.requestId, err }, 'Token verification failed');
    }

    const isExpired =
      err instanceof Error &&
      (err.message.includes('expired') || err.message.includes('exp'));

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: isExpired
          ? 'Token has expired'
          : 'Invalid or expired token',
        details: null,
      },
      meta: null,
    };
    res.status(401).json(response);
    return;
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      name: decodedToken.name,
      email: decodedToken.email,
      picture: decodedToken.picture,
      phoneNumber: decodedToken.phone_number,
      emailVerified: decodedToken.email_verified,
      role: (decodedToken.role as string) ?? undefined,
      customClaims: decodedToken,
    };
  } catch (err) {
    logger.debug(
      { requestId: req.requestId, err },
      'Optional auth: invalid token, proceeding unauthenticated',
    );
  }

  next();
}
