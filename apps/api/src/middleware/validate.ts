import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../lib/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path.length > 0
            ? `body.${issue.path.join('.')}`
            : 'body';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        }
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path.length > 0
            ? `query.${issue.path.join('.')}`
            : 'query';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        }
      } else {
        req.query = result.data as typeof req.query;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path.length > 0
            ? `params.${issue.path.join('.')}`
            : 'params';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        }
      } else {
        req.params = result.data as typeof req.params;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    next();
  };
};
