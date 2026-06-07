import type { Request } from 'express';
import { BadRequestError } from './errors.js';

/**
 * Express 5 types `req.params[key]` as `string | string[]`. This helper coerces
 * to a single string and throws BadRequestError if the param is missing.
 */
export function getParam(req: Request, key: string): string {
  const value = req.params[key];
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]!;
  throw new BadRequestError(`${key} is required`);
}
