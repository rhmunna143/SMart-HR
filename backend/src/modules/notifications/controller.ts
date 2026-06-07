import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { NotFoundError } from '../../lib/errors.js';
import { getParam } from '../../lib/params.js';
import * as q from './queries.js';

// GET /notifications?limit=50
export const list = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50) || 50));
  const rows = await q.listNotifications(req.user!.id, limit);
  const unread = await q.countUnread(req.user!.id);
  sendOk(res, rows, { unread });
});

// GET /notifications/unread-count
export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const n = await q.countUnread(req.user!.id);
  sendOk(res, { count: n });
});

// PATCH /notifications/:id/read
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  const ok = await q.markOneRead(id, req.user!.id);
  if (!ok) throw new NotFoundError('Notification not found');
  sendOk(res, { id, read: true });
});

// PATCH /notifications/read-all
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await q.markAllRead(req.user!.id);
  sendOk(res, { done: true });
});
