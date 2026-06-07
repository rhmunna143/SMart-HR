import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { NotFoundError, ForbiddenError, PayloadTooLargeError } from '../../lib/errors.js';
import { getParam } from '../../lib/params.js';
import { logActivity } from '../../lib/activity.js';
import * as q from './queries.js';
import { findTaskById } from '../tasks/queries.js';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
});

/** Wraps multer so size errors are converted to PayloadTooLargeError */
function multerMiddleware(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: unknown) => {
    if (
      err instanceof multer.MulterError &&
      err.code === 'LIMIT_FILE_SIZE'
    ) {
      return next(new PayloadTooLargeError('File exceeds the 5 MB limit.'));
    }
    if (err) return next(err);
    next();
  });
}

// GET /tasks/:taskId/attachments
export const list = asyncHandler(async (req: Request, res: Response) => {
  const taskId = getParam(req, 'taskId');
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task not found');
  const rows = await q.listAttachments(taskId);
  sendOk(res, rows);
});

// POST /tasks/:taskId/attachments  (multipart/form-data, field "file")
export const upload_: [typeof multerMiddleware, ReturnType<typeof asyncHandler>] = [
  multerMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const taskId = getParam(req, 'taskId');
    const task = await findTaskById(taskId);
    if (!task) throw new NotFoundError('Task not found');
    if (!req.file) throw new NotFoundError('No file provided.');

    const meta = await q.insertAttachment({
      taskId,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      data: req.file.buffer,
      uploadedById: req.user!.id,
    });

    await logActivity({
      actorId: req.user!.id,
      action: 'ATTACHMENT_UPLOADED',
      entityType: 'TASK',
      entityId: taskId,
      message: `${req.user!.email} uploaded "${req.file.originalname}" to task "${task.title}"`,
    });
    sendOk(res, meta);
  }),
];

// GET /attachments/:id/download
export const download = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  const row = await q.findAttachmentById(id);
  if (!row) throw new NotFoundError('Attachment not found');
  res.setHeader('Content-Type', row.mime_type);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(row.filename)}"`,
  );
  res.setHeader('Content-Length', row.size_bytes);
  res.end(row.data);
});

// DELETE /attachments/:id
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  const row = await q.findAttachmentById(id);
  if (!row) throw new NotFoundError('Attachment not found');

  const user = req.user!;
  const isOwner = row.uploaded_by_id === user.id;
  const canDelete = isOwner || user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER';
  if (!canDelete) throw new ForbiddenError('You cannot delete this attachment.');

  await q.deleteAttachment(id);
  sendOk(res, { id, deleted: true });
});
