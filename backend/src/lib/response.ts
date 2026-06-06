import type { Response } from 'express';

export interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export function sendOk<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  const body: Envelope<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.json(body);
}

export function sendErr(
  res: Response,
  status: number,
  message: string,
  errors?: Record<string, string>,
) {
  const body: Envelope<never> = { success: false, message };
  if (errors) body.errors = errors;
  res.status(status).json(body);
}
