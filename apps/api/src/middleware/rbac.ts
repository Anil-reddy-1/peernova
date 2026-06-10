import type { Request, Response, NextFunction } from 'express';
import type { UserRole, ApiResponse } from '@peer-tutoring/types';

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: null,
        },
        meta: null,
      };
      res.status(401).json(response);
      return;
    }

    const userRole = req.user.role;

    if (!userRole || !roles.includes(userRole as UserRole)) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: `This action requires one of the following roles: ${roles.join(', ')}`,
          details: null,
        },
        meta: null,
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}

export function requireEmailVerified() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: null,
        },
        meta: null,
      };
      res.status(401).json(response);
      return;
    }

    if (!req.user.emailVerified) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Email verification required',
          details: null,
        },
        meta: null,
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}
