import { NotFoundError } from '../../lib/errors.js';
import { logActivity } from '../../lib/activity.js';
import { getTeamMemberVisibility } from '../../lib/settings.js';
import type { AuthUser, Project } from '../../types/index.js';
import * as q from './queries.js';

export interface ListOpts {
  status?: Project['status'];
  search?: string;
  sort?: 'recent' | 'deadline' | 'updated' | 'name';
  page?: number;
  limit?: number;
}

export async function listForUser(user: AuthUser, opts: ListOpts) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const visibility = await getTeamMemberVisibility();
  return q.listProjects({
    status: opts.status,
    search: opts.search,
    sort: opts.sort,
    page,
    limit,
    offset: (page - 1) * limit,
    userId: user.id,
    userRole: user.role,
    visibility,
  });
}

export async function getForUser(id: string, user: AuthUser): Promise<Project> {
  const project = await q.findProjectById(id);
  if (!project) throw new NotFoundError('Project not found');
  if (user.role === 'TEAM_MEMBER') {
    const visibility = await getTeamMemberVisibility();
    if (visibility === 'ASSIGNED_ONLY') {
      const ok = await q.userBelongsToProject(id, user.id);
      if (!ok) throw new NotFoundError('Project not found');
    }
  }
  return project;
}

export async function create(input: {
  name: string;
  description?: string;
  deadline?: string;
  status?: Project['status'];
}, user: AuthUser): Promise<Project> {
  const project = await q.insertProject({ ...input, createdById: user.id });
  await logActivity({
    actorId: user.id,
    action: 'PROJECT_CREATED',
    entityType: 'PROJECT',
    entityId: project.id,
    message: `${user.email} created project "${project.name}"`,
  });
  return project;
}

export async function update(id: string, patch: {
  name?: string;
  description?: string;
  deadline?: string;
  status?: Project['status'];
}, user: AuthUser): Promise<Project> {
  const existing = await q.findProjectById(id);
  if (!existing) throw new NotFoundError('Project not found');
  const updated = await q.updateProject(id, patch);
  if (!updated) throw new NotFoundError('Project not found');
  await logActivity({
    actorId: user.id,
    action: 'PROJECT_UPDATED',
    entityType: 'PROJECT',
    entityId: id,
    message: `${user.email} updated project "${updated.name}"`,
  });
  return updated;
}

export async function softDelete(id: string, user: AuthUser): Promise<void> {
  const existing = await q.findProjectById(id);
  if (!existing) throw new NotFoundError('Project not found');
  const ok = await q.softDeleteProject(id);
  if (!ok) throw new NotFoundError('Project not found');
  await logActivity({
    actorId: user.id,
    action: 'PROJECT_DELETED',
    entityType: 'PROJECT',
    entityId: id,
    message: `${user.email} deleted project "${existing.name}"`,
  });
}

export async function restore(id: string, user: AuthUser): Promise<Project> {
  const restored = await q.restoreProject(id);
  if (!restored) throw new NotFoundError('Project not found');
  await logActivity({
    actorId: user.id,
    action: 'PROJECT_RESTORED',
    entityType: 'PROJECT',
    entityId: id,
    message: `${user.email} restored project "${restored.name}"`,
  });
  return restored;
}
