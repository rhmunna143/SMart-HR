import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
import { getParam } from '../../lib/params.js';
import { logActivity } from '../../lib/activity.js';
import { validateCreateComment } from './validators.js';
import * as q from './queries.js';
import { findTaskById } from '../tasks/queries.js';

// GET /tasks/:taskId/comments
export const list = asyncHandler(async (req: Request, res: Response) => {
  const taskId = getParam(req, 'taskId');
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task not found');
  const rows = await q.listComments(taskId);
  sendOk(res, rows);
});

// POST /tasks/:taskId/comments
export const create = asyncHandler(async (req: Request, res: Response) => {
  const taskId = getParam(req, 'taskId');
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task not found');
  const { body } = validateCreateComment(req.body);
  const comment = await q.insertComment(taskId, req.user!.id, body);
  await logActivity({
    actorId: req.user!.id,
    action: 'COMMENT_CREATED',
    entityType: 'TASK',
    entityId: taskId,
    message: `${req.user!.email} commented on task "${task.title}"`,
  });
  sendOk(res, comment);
});

// DELETE /comments/:id
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  const comment = await q.findCommentById(id);
  if (!comment) throw new NotFoundError('Comment not found');

  const user = req.user!;
  const isOwner = comment.author_id === user.id;
  const canDelete = isOwner || user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER';
  if (!canDelete) throw new ForbiddenError('You cannot delete this comment.');

  await q.deleteComment(id);
  sendOk(res, { id, deleted: true });
});
