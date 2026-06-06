import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import type { UserRole } from '../types/index.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}
