import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { sendErr } from '../lib/response.js';
import { isProd } from '../config/env.js';

export function notFound(_req: Request, res: Response) {
  sendErr(res, 404, 'Route not found');
}

interface PgError {
  code?: string;
  message?: string;
  table?: string;
}

function isPgError(err: unknown): err is PgError {
  return typeof err === 'object' && err !== null && 'code' in err;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendErr(res, err.status, err.message, err.details);
  }

  // Always log the underlying error in dev so you can see what's actually wrong
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error('[errorHandler]', err);
  }

  // Friendly mapping for common Postgres errors that mean the schema isn't ready
  if (isPgError(err)) {
    // 42P01 = undefined_table, 42704 = undefined_object (e.g. missing enum type)
    if (err.code === '42P01' || err.code === '42704') {
      return sendErr(
        res,
        503,
        'Database schema is not initialized. Run `npm run migrate:up && npm run db:seed` in the backend folder.',
      );
    }
    // 3D000 = invalid_catalog_name (database doesn't exist)
    if (err.code === '3D000') {
      return sendErr(
        res,
        503,
        'Database does not exist. Create it and re-run `npm run migrate:up && npm run db:seed`.',
      );
    }
    // 28P01 = invalid_password, 28000 = invalid_authorization_specification
    if (err.code === '28P01' || err.code === '28000') {
      return sendErr(res, 503, 'Database credentials are invalid. Check DATABASE_URL.');
    }
    // ECONNREFUSED / ENOTFOUND surface as pg errors with these codes
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return sendErr(res, 503, 'Cannot reach the database. Is it running, and is DATABASE_URL correct?');
    }
  }

  sendErr(res, 500, 'Internal server error');
}
