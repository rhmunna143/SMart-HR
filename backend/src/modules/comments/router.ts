import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { list, create, remove } from './controller.js';

// Mounted at /api/v1/tasks/:taskId/comments  (mergeParams to inherit :taskId)
export const taskCommentsRouter = Router({ mergeParams: true });
taskCommentsRouter.use(requireAuth);
taskCommentsRouter.get('/', list);
taskCommentsRouter.post('/', create);

// Mounted at /api/v1/comments
export const commentsRouter = Router();
commentsRouter.use(requireAuth);
commentsRouter.delete('/:id', remove);
