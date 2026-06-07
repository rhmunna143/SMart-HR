import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as c from './controller.js';

export const membersRouter = Router();
membersRouter.use(requireAuth);

// /members
membersRouter.get('/', c.list);
membersRouter.get('/:id/workload', c.workload);

// /projects/:id/members  → mounted via a separate router so the URL shape
// matches the PRD; the project's :id is in req.params.id thanks to mergeParams.
export const projectMembersRouter: Router = Router({ mergeParams: true });
projectMembersRouter.use(requireAuth);
projectMembersRouter.get('/', c.listProjectMembers);
projectMembersRouter.post('/', requireRole('ADMIN', 'PROJECT_MANAGER'), c.addProjectMember);
projectMembersRouter.delete(
  '/:userId',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  c.removeProjectMember,
);
