import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { isProd } from '../../config/env.js';
import * as svc from './service.js';
import * as v from './validators.js';
import { findUserById } from './queries.js';

const REFRESH_COOKIE = 'rt';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, REFRESH_COOKIE_OPTS);
}

export const signup = asyncHandler(async (req, res) => {
  const input = v.validateSignup(req.body);
  const result = await svc.signup(input);
  setRefreshCookie(res, result.refreshToken);
  sendOk(res, { user: result.user, accessToken: result.accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const input = v.validateLogin(req.body);
  const result = await svc.login(input);
  setRefreshCookie(res, result.refreshToken);
  sendOk(res, { user: result.user, accessToken: result.accessToken });
});

export const demoLogin = asyncHandler(async (_req, res) => {
  const result = await svc.demoLogin();
  setRefreshCookie(res, result.refreshToken);
  sendOk(res, { user: result.user, accessToken: result.accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  if (!token) throw new UnauthorizedError('Missing refresh token');
  const result = await svc.refresh(token);
  setRefreshCookie(res, result.refreshToken);
  sendOk(res, { user: result.user, accessToken: result.accessToken });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const user = await findUserById(req.user.id);
  if (!user) throw new UnauthorizedError();
  sendOk(res, { user });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  sendOk(res, { ok: true });
});
