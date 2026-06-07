import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as c from './controller.js';

export const activityRouter = Router();
activityRouter.use(requireAuth);
activityRouter.get('/', c.list);
