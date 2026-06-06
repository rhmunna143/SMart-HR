import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../types/index.js';

export interface AccessPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export interface RefreshPayload {
  sub: string;
  v: number; // token version for rotation
}

export function signAccess(payload: AccessPayload): string {
  const opts: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
}

export function signRefresh(payload: RefreshPayload): string {
  const opts: SignOptions = { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccess(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefresh(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}
