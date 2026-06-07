import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { logActivity } from '../../lib/activity.js';
import { getTeamMemberVisibility } from '../../lib/settings.js';
import { insertNotification } from '../notifications/queries.js';
import type { AuthUser, Task, TaskPriority, TaskStatus } from '../../types/index.js';
import { findProjectById, userBelongsToProject } from '../projects/queries.js';
import * as q from './queries.js';

const DUP_TITLE_PG_CODE = '23505';

export interface ListOpts {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  deadline?: 'upcoming' | 'overdue';
  search?: string;
  sort?: 'recent' | 'due' | 'priority' | 'updated';
  page?: number;
  limit?: number;
}

export async function listForUser(user: AuthUser, opts: ListOpts) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const visibility = await getTeamMemberVisibility();
  return q.listTasks({
    projectId: opts.projectId,
    status: opts.status,
    priority: opts.priority,
    assigneeId: opts.assigneeId,
    deadline: opts.deadline,
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

export async function getForUser(id: string, user: AuthUser): Promise<Task> {
  const task = await q.findTaskById(id);
  if (!task) throw new NotFoundError('Task not found');
  if (user.role === 'TEAM_MEMBER') {
    const visibility = await getTeamMemberVisibility();
    if (visibility === 'ASSIGNED_ONLY' && task.assignee_id !== user.id) {
      const inProject = await userBelongsToProject(task.project_id, user.id);
      if (!inProject) throw new NotFoundError('Task not found');
    }
  }
  return task;
}

export async function create(input: {
  project_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}, user: AuthUser): Promise<Task> {
  const project = await findProjectById(input.project_id);
  if (!project) throw new NotFoundError('Project not found');
  try {
    const task = await q.insertTask({
      projectId: input.project_id,
      title: input.title,
      description: input.description,
      assigneeId: input.assignee_id,
      dueDate: input.due_date,
      priority: input.priority,
      status: input.status,
      createdById: user.id,
    });
    await logActivity({
      actorId: user.id,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      message: `${user.email} created task "${task.title}"`,
    });
    // Notify assignee (skip silently on error — non-blocking)
    if (task.assignee_id && task.assignee_id !== user.id) {
      insertNotification(
        task.assignee_id,
        `You were assigned to task "${task.title}"`,
      ).catch(() => undefined);
    }
    return task;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError('This task already exists in the project.', { title: 'This task already exists in the project.' });
    }
    throw err;
  }
}

export async function update(id: string, patch: {
  title?: string;
  description?: string;
  assignee_id?: string | null;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}, user: AuthUser): Promise<Task> {
  const existing = await q.findTaskById(id);
  if (!existing) throw new NotFoundError('Task not found');

  // Workflow rule: cannot reassign a completed task
  if (
    existing.status === 'COMPLETED' &&
    patch.assignee_id !== undefined &&
    patch.assignee_id !== existing.assignee_id
  ) {
    throw new ConflictError('Completed tasks cannot be reassigned.', {
      assignee_id: 'Completed tasks cannot be reassigned.',
    });
  }

  try {
    const updated = await q.updateTask(id, patch);
    if (!updated) throw new NotFoundError('Task not found');
    await logActivity({
      actorId: user.id,
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: id,
      message: `${user.email} updated task "${updated.title}"`,
    });
    if (patch.assignee_id !== undefined && patch.assignee_id !== existing.assignee_id) {
      await logActivity({
        actorId: user.id,
        action: 'TASK_ASSIGNED',
        entityType: 'TASK',
        entityId: id,
        message: patch.assignee_id
          ? `${user.email} assigned task "${updated.title}"`
          : `${user.email} unassigned task "${updated.title}"`,
      });
      // Notify new assignee (skip silently on error)
      if (patch.assignee_id && patch.assignee_id !== user.id) {
        insertNotification(
          patch.assignee_id,
          `You were assigned to task "${updated.title}"`,
        ).catch(() => undefined);
      }
    }
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError('This task already exists in the project.', { title: 'This task already exists in the project.' });
    }
    throw err;
  }
}

export async function updateStatus(
  id: string,
  status: TaskStatus,
  user: AuthUser,
): Promise<Task> {
  const existing = await q.findTaskById(id);
  if (!existing) throw new NotFoundError('Task not found');

  const isAdminOrPm = user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER';
  const isAssignee = existing.assignee_id === user.id;
  if (!isAdminOrPm && !isAssignee) {
    throw new ForbiddenError('You can only update tasks assigned to you.');
  }

  const updated = await q.updateTask(id, { status });
  if (!updated) throw new NotFoundError('Task not found');
  await logActivity({
    actorId: user.id,
    action: 'TASK_STATUS_CHANGED',
    entityType: 'TASK',
    entityId: id,
    message: `${user.email} set "${updated.title}" to ${status}`,
  });
  return updated;
}

export async function softDelete(id: string, user: AuthUser): Promise<void> {
  const existing = await q.findTaskById(id);
  if (!existing) throw new NotFoundError('Task not found');
  const ok = await q.softDeleteTask(id);
  if (!ok) throw new NotFoundError('Task not found');
  await logActivity({
    actorId: user.id,
    action: 'TASK_DELETED',
    entityType: 'TASK',
    entityId: id,
    message: `${user.email} deleted task "${existing.title}"`,
  });
}

export async function restore(id: string, user: AuthUser): Promise<Task> {
  try {
    const restored = await q.restoreTask(id);
    if (!restored) throw new NotFoundError('Task not found');
    await logActivity({
      actorId: user.id,
      action: 'TASK_RESTORED',
      entityType: 'TASK',
      entityId: id,
      message: `${user.email} restored task "${restored.title}"`,
    });
    return restored;
  } catch (err) {
    // Restoring may resurrect a title that already exists on an active task
    if (isUniqueViolation(err)) {
      throw new ConflictError('A task with this title already exists in the project.', {
        title: 'A task with this title already exists in the project.',
      });
    }
    throw err;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === DUP_TITLE_PG_CODE
  );
}
