import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { list, upload_, download, remove } from './controller.js';

// Mounted at /api/v1/tasks/:taskId/attachments  (mergeParams to inherit :taskId)
export const taskAttachmentsRouter = Router({ mergeParams: true });
taskAttachmentsRouter.use(requireAuth);
taskAttachmentsRouter.get('/', list);
taskAttachmentsRouter.post('/', ...upload_);

// Mounted at /api/v1/attachments
export const attachmentsRouter = Router();
attachmentsRouter.use(requireAuth);
attachmentsRouter.get('/:id/download', download);
attachmentsRouter.delete('/:id', remove);
