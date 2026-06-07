import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { logActivity } from '../../lib/activity.js';
import { findProjectById } from '../projects/queries.js';
import type { AuthUser } from '../../types/index.js';
import * as q from './queries.js';

export async function addMember(projectId: string, userId: string, actor: AuthUser) {
  const project = await findProjectById(projectId);
  if (!project) throw new NotFoundError('Project not found');
  const user = await q.findUserById(userId);
  if (!user) throw new NotFoundError('User not found');

  const inserted = await q.addProjectMember(projectId, userId);
  if (!inserted) {
    throw new ConflictError('This member is already in the project.');
  }
  await logActivity({
    actorId: actor.id,
    action: 'MEMBER_ADDED',
    entityType: 'MEMBER',
    entityId: userId,
    message: `${actor.email} added ${user.name} to "${project.name}"`,
  });
  return user;
}

export async function removeMember(projectId: string, userId: string, actor: AuthUser) {
  const project = await findProjectById(projectId);
  if (!project) throw new NotFoundError('Project not found');
  const user = await q.findUserById(userId);
  if (!user) throw new NotFoundError('User not found');

  const removed = await q.removeProjectMember(projectId, userId);
  if (!removed) {
    throw new NotFoundError('Member is not in this project.');
  }
  await logActivity({
    actorId: actor.id,
    action: 'MEMBER_REMOVED',
    entityType: 'MEMBER',
    entityId: userId,
    message: `${actor.email} removed ${user.name} from "${project.name}"`,
  });
}

export async function workloadFor(userId: string) {
  const summary = await q.getMemberWorkload(userId);
  if (!summary) throw new NotFoundError('User not found');
  return summary;
}

export async function listForProject(projectId: string) {
  const project = await findProjectById(projectId);
  if (!project) throw new NotFoundError('Project not found');
  return q.listProjectMembers(projectId);
}
