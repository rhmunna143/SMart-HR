import { validate, optional } from '../../lib/validate.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../types/index.js';

export const validateCreateTask = (body: unknown) =>
  validate(body, (v, src) => ({
    project_id: v.uuid('project_id'),
    title: v.str('title', { min: 1, max: 200 }),
    description: optional(src.description, () => v.str('description', { max: 4000 })),
    assignee_id: optional(src.assignee_id, () => v.uuid('assignee_id')),
    due_date: optional(src.due_date, () => v.dateNotPast('due_date')),
    priority: optional(src.priority, () => v.enumOf('priority', TASK_PRIORITIES)),
    status: optional(src.status, () => v.enumOf('status', TASK_STATUSES)),
  }));

export const validateUpdateTask = (body: unknown) =>
  validate(body, (v, src) => ({
    title: optional(src.title, () => v.str('title', { min: 1, max: 200 })),
    description: optional(src.description, () => v.str('description', { max: 4000 })),
    assignee_id:
      src.assignee_id === null
        ? null
        : optional(src.assignee_id, () => v.uuid('assignee_id')),
    due_date: optional(src.due_date, () => v.dateNotPast('due_date')),
    priority: optional(src.priority, () => v.enumOf('priority', TASK_PRIORITIES)),
    status: optional(src.status, () => v.enumOf('status', TASK_STATUSES)),
  }));

export const validateUpdateTaskStatus = (body: unknown) =>
  validate(body, (v) => ({
    status: v.enumOf('status', TASK_STATUSES),
  }));

export const validateTaskListQuery = (q: unknown) =>
  validate(q, (v, src) => ({
    projectId: optional(src.projectId, () => v.uuid('projectId')),
    status: optional(src.status, () => v.enumOf('status', TASK_STATUSES)),
    priority: optional(src.priority, () => v.enumOf('priority', TASK_PRIORITIES)),
    assigneeId: optional(src.assigneeId, () => v.uuid('assigneeId')),
    deadline: optional(src.deadline, () =>
      v.enumOf('deadline', ['upcoming', 'overdue'] as const),
    ),
    search: optional(src.search, () => v.str('search', { max: 200 })),
    sort: optional(src.sort, () =>
      v.enumOf('sort', ['recent', 'due', 'priority', 'updated'] as const),
    ),
    page: optional(src.page, () => v.int('page', { min: 1 })),
    limit: optional(src.limit, () => v.int('limit', { min: 1, max: 100 })),
  }));
