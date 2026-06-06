import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { sendErr } from '../lib/response.js';
import { isProd } from '../config/env.js';

export function notFound(_req: Request, res: Response) {
  sendErr(res, 404, 'Route not found');
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendErr(res, err.status, err.message, err.details);
  }
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  sendErr(res, 500, 'Internal server error');
}
