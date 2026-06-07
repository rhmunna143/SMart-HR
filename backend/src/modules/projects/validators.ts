import { validate, optional } from '../../lib/validate.js';
import { PROJECT_STATUSES } from '../../types/index.js';

export const validateCreateProject = (body: unknown) =>
  validate(body, (v, src) => ({
    name: v.str('name', { min: 1, max: 160 }),
    description: optional(src.description, () => v.str('description', { max: 4000 })),
    deadline: optional(src.deadline, () => v.dateNotPast('deadline')),
    status: optional(src.status, () => v.enumOf('status', PROJECT_STATUSES)),
  }));

export const validateUpdateProject = (body: unknown) =>
  validate(body, (v, src) => ({
    name: optional(src.name, () => v.str('name', { min: 1, max: 160 })),
    description: optional(src.description, () => v.str('description', { max: 4000 })),
    deadline: optional(src.deadline, () => v.dateNotPast('deadline')),
    status: optional(src.status, () => v.enumOf('status', PROJECT_STATUSES)),
  }));

export const validateProjectListQuery = (q: unknown) =>
  validate(q, (v, src) => ({
    status: optional(src.status, () => v.enumOf('status', PROJECT_STATUSES)),
    search: optional(src.search, () => v.str('search', { max: 160 })),
    sort: optional(src.sort, () =>
      v.enumOf('sort', ['recent', 'deadline', 'updated', 'name'] as const),
    ),
    page: optional(src.page, () => v.int('page', { min: 1 })),
    limit: optional(src.limit, () => v.int('limit', { min: 1, max: 100 })),
  }));
