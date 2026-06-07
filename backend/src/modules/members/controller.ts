import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { getParam } from '../../lib/params.js';
import * as v from './validators.js';
import * as svc from './service.js';
import { listAllUsers, listMembersWithWorkload } from './queries.js';

export const list = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const withWorkload = req.query.withWorkload === 'true' || req.query.workload === 'true';
  if (withWorkload) {
    sendOk(res, await listMembersWithWorkload());
    return;
  }
  const users = await listAllUsers({ search });
  sendOk(res, users);
});

export const workload = asyncHandler(async (req, res) => {
  const id = getParam(req, 'id');
  const summary = await svc.workloadFor(id);
  sendOk(res, summary);
});

export const listProjectMembers = asyncHandler(async (req, res) => {
  const projectId = getParam(req, 'id');
  const members = await svc.listForProject(projectId);
  sendOk(res, members);
});

export const addProjectMember = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const projectId = getParam(req, 'id');
  const { user_id } = v.validateAddProjectMember(req.body);
  const member = await svc.addMember(projectId, user_id, req.user);
  res.status(201);
  sendOk(res, member);
});

export const removeProjectMember = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const projectId = getParam(req, 'id');
  const userId = getParam(req, 'userId');
  await svc.removeMember(projectId, userId, req.user);
  sendOk(res, { project_id: projectId, user_id: userId, removed: true });
});
