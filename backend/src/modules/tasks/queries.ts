import { many, one, query } from '../../lib/query.js';
import type { Task, TaskPriority, TaskStatus, UserRole } from '../../types/index.js';
import type { VisibilitySetting } from '../../lib/settings.js';

export interface ListFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  deadline?: 'upcoming' | 'overdue';
  search?: string;
  sort?: 'recent' | 'due' | 'priority' | 'updated';
  page: number;
  limit: number;
  offset: number;
  userId: string;
  userRole: UserRole;
  visibility: VisibilitySetting;
}

function sortClause(sort: ListFilters['sort']): string {
  switch (sort) {
    case 'due':
      return 'ORDER BY t.due_date NULLS LAST, t.created_at DESC';
    case 'priority':
      // HIGH > MEDIUM > LOW
      return "ORDER BY CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, t.due_date NULLS LAST";
    case 'updated':
      return 'ORDER BY t.updated_at DESC';
    case 'recent':
    default:
      return 'ORDER BY t.created_at DESC';
  }
}

function scope(userRole: UserRole, visibility: VisibilitySetting) {
  if (userRole !== 'TEAM_MEMBER' || visibility === 'ALL') {
    return { sql: '', needsUserId: false };
  }
  // TM with ASSIGNED_ONLY: tasks in projects they belong to OR assigned directly
  return {
    sql: ` AND (
      t.assignee_id = $__USER__
      OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = t.project_id AND pm.user_id = $__USER__
      )
    )`,
    needsUserId: true,
  };
}

export async function listTasks(f: ListFilters): Promise<{ rows: Task[]; total: number }> {
  const params: unknown[] = [];
  const where: string[] = ['t.deleted_at IS NULL'];
  if (f.projectId) {
    params.push(f.projectId);
    where.push(`t.project_id = $${params.length}`);
  }
  if (f.status) {
    params.push(f.status);
    where.push(`t.status = $${params.length}`);
  }
  if (f.priority) {
    params.push(f.priority);
    where.push(`t.priority = $${params.length}`);
  }
  if (f.assigneeId) {
    params.push(f.assigneeId);
    where.push(`t.assignee_id = $${params.length}`);
  }
  if (f.deadline === 'overdue') {
    where.push(`t.due_date < CURRENT_DATE AND t.status <> 'COMPLETED'`);
  } else if (f.deadline === 'upcoming') {
    where.push(`t.due_date >= CURRENT_DATE AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'`);
  }
  if (f.search) {
    params.push(`%${f.search.toLowerCase()}%`);
    const idx = params.length;
    where.push(`(lower(t.title) LIKE $${idx} OR lower(coalesce(t.description, '')) LIKE $${idx})`);
  }
  const sc = scope(f.userRole, f.visibility);
  let scopeSql = '';
  if (sc.needsUserId) {
    params.push(f.userId);
    scopeSql = sc.sql.replaceAll('$__USER__', `$${params.length}`);
  }

  const baseWhere = `WHERE ${where.join(' AND ')}${scopeSql}`;

  const listSql = `
    SELECT t.id, t.project_id, t.title, t.description, t.assignee_id,
           t.due_date, t.priority, t.status, t.created_by_id,
           t.created_at, t.updated_at
    FROM tasks t
    ${baseWhere}
    ${sortClause(f.sort)}
    LIMIT ${f.limit} OFFSET ${f.offset}
  `;
  const countSql = `SELECT count(*)::int AS total FROM tasks t ${baseWhere}`;

  const [rows, totalRow] = await Promise.all([
    many<Task>(listSql, params),
    one<{ total: number }>(countSql, params),
  ]);
  return { rows, total: totalRow?.total ?? 0 };
}

export async function findTaskById(id: string, includeDeleted = false): Promise<Task | null> {
  return one<Task>(
    `SELECT id, project_id, title, description, assignee_id, due_date,
            priority, status, created_by_id, created_at, updated_at
     FROM tasks
     WHERE id = $1 ${includeDeleted ? '' : 'AND deleted_at IS NULL'}`,
    [id],
  );
}

export async function insertTask(opts: {
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  createdById: string;
}): Promise<Task> {
  const row = await one<Task>(
    `INSERT INTO tasks
       (project_id, title, description, assignee_id, due_date, priority, status, created_by_id)
     VALUES ($1,$2,$3,$4,$5,
             COALESCE($6,'MEDIUM')::task_priority,
             COALESCE($7,'TODO')::task_status, $8)
     RETURNING id, project_id, title, description, assignee_id, due_date,
               priority, status, created_by_id, created_at, updated_at`,
    [
      opts.projectId,
      opts.title,
      opts.description ?? null,
      opts.assigneeId ?? null,
      opts.dueDate ?? null,
      opts.priority ?? null,
      opts.status ?? null,
      opts.createdById,
    ],
  );
  return row!;
}

export async function updateTask(
  id: string,
  patch: {
    title?: string;
    description?: string;
    assignee_id?: string | null;
    due_date?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
  },
): Promise<Task | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.title !== undefined)       { params.push(patch.title);       sets.push(`title = $${params.length}`); }
  if (patch.description !== undefined) { params.push(patch.description); sets.push(`description = $${params.length}`); }
  if (patch.assignee_id !== undefined) { params.push(patch.assignee_id); sets.push(`assignee_id = $${params.length}`); }
  if (patch.due_date !== undefined)    { params.push(patch.due_date);    sets.push(`due_date = $${params.length}`); }
  if (patch.priority !== undefined)    { params.push(patch.priority);    sets.push(`priority = $${params.length}::task_priority`); }
  if (patch.status !== undefined)      { params.push(patch.status);      sets.push(`status = $${params.length}::task_status`); }
  if (sets.length === 0) {
    return findTaskById(id);
  }
  params.push(id);
  const sql = `
    UPDATE tasks SET ${sets.join(', ')}
    WHERE id = $${params.length} AND deleted_at IS NULL
    RETURNING id, project_id, title, description, assignee_id, due_date,
              priority, status, created_by_id, created_at, updated_at
  `;
  return one<Task>(sql, params);
}

export async function softDeleteTask(id: string): Promise<boolean> {
  const r = await query(
    `UPDATE tasks SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function restoreTask(id: string): Promise<Task | null> {
  return one<Task>(
    `UPDATE tasks SET deleted_at = NULL WHERE id = $1
     RETURNING id, project_id, title, description, assignee_id, due_date,
               priority, status, created_by_id, created_at, updated_at`,
    [id],
  );
}
