import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  const id = typeof existingId === 'string' && existingId.length > 0
    ? existingId
    : uuidv4();

  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
