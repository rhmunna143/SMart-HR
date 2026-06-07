import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as c from './controller.js';

export const membersRouter = Router();
membersRouter.use(requireAuth);
membersRouter.get('/', c.list);
