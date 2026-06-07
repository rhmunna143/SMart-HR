import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as c from './controller.js';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get('/', c.list);
tasksRouter.get('/:id', c.get);
tasksRouter.post('/', requireRole('ADMIN', 'PROJECT_MANAGER'), c.create);
tasksRouter.patch('/:id', requireRole('ADMIN', 'PROJECT_MANAGER'), c.update);
// status update is permitted for the assignee (TM) too — service layer enforces
tasksRouter.patch('/:id/status', c.updateStatus);
tasksRouter.delete('/:id', requireRole('ADMIN', 'PROJECT_MANAGER'), c.remove);
tasksRouter.post('/:id/restore', requireRole('ADMIN', 'PROJECT_MANAGER'), c.restore);
