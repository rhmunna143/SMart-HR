import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { pageMeta } from '../../lib/paginate.js';
import { getParam } from '../../lib/params.js';
import * as v from './validators.js';
import * as svc from './service.js';

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const q = v.validateProjectListQuery(req.query);
  const page = q.page ?? 1;
  const limit = q.limit ?? 20;
  const result = await svc.listForUser(req.user, { ...q, page, limit });
  sendOk(res, result.rows, pageMeta(result.total, { page, limit, offset: (page - 1) * limit }));
});

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const input = v.validateCreateProject(req.body);
  const project = await svc.create(input, req.user);
  res.status(201);
  sendOk(res, project);
});

export const get = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const project = await svc.getForUser(getParam(req, 'id'), req.user);
  sendOk(res, project);
});

export const update = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const patch = v.validateUpdateProject(req.body);
  const project = await svc.update(getParam(req, 'id'), patch, req.user);
  sendOk(res, project);
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const id = getParam(req, 'id');
  await svc.softDelete(id, req.user);
  sendOk(res, { id, deleted: true });
});

export const restore = asyncHandler(async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  const project = await svc.restore(getParam(req, 'id'), req.user);
  sendOk(res, project);
});
