import { many, one, query } from '../../lib/query.js';
import type { User } from '../../types/index.js';

export interface ListFilters {
  search?: string;
}

export async function listAllUsers(f: ListFilters): Promise<User[]> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (f.search) {
    params.push(`%${f.search.toLowerCase()}%`);
    where.push(`(lower(u.name) LIKE $${params.length} OR lower(u.email) LIKE $${params.length})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return many<User>(
    `SELECT u.id, u.name, u.email, u.role, u.created_at
     FROM users u
     ${whereSql}
     ORDER BY lower(u.name) ASC`,
    params,
  );
}

export async function findUserById(id: string): Promise<User | null> {
  return one<User>(
    `SELECT u.id, u.name, u.email, u.role, u.created_at FROM users u WHERE u.id = $1`,
    [id],
  );
}

export async function listProjectMembers(projectId: string): Promise<User[]> {
  return many<User>(
    `SELECT u.id, u.name, u.email, u.role, u.created_at
     FROM users u
     INNER JOIN project_members pm ON pm.user_id = u.id
     WHERE pm.project_id = $1
     ORDER BY lower(u.name) ASC`,
    [projectId],
  );
}

export async function addProjectMember(projectId: string, userId: string): Promise<boolean> {
  // ON CONFLICT … DO NOTHING so re-adding is idempotent; rowCount tells us if it inserted
  const r = await query(
    `INSERT INTO project_members (project_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (project_id, user_id) DO NOTHING`,
    [projectId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function removeProjectMember(projectId: string, userId: string): Promise<boolean> {
  const r = await query(
    `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export interface WorkloadSummary {
  user: User;
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
  overdue: number;
  by_project: Array<{
    project_id: string;
    project_name: string;
    total: number;
    completed: number;
    pending: number;
  }>;
}

export async function getMemberWorkload(userId: string): Promise<WorkloadSummary | null> {
  const user = await findUserById(userId);
  if (!user) return null;

  const counts = await one<{
    total: number;
    completed: number;
    in_progress: number;
    todo: number;
    overdue: number;
  }>(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
       count(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress,
       count(*) FILTER (WHERE status = 'TODO')::int AS todo,
       count(*) FILTER (WHERE status <> 'COMPLETED' AND due_date < CURRENT_DATE)::int AS overdue
     FROM tasks
     WHERE assignee_id = $1 AND deleted_at IS NULL`,
    [userId],
  );

  const byProject = await many<{
    project_id: string;
    project_name: string;
    total: number;
    completed: number;
    pending: number;
  }>(
    `SELECT
       p.id AS project_id,
       p.name AS project_name,
       count(t.*)::int AS total,
       count(t.*) FILTER (WHERE t.status = 'COMPLETED')::int AS completed,
       count(t.*) FILTER (WHERE t.status <> 'COMPLETED')::int AS pending
     FROM tasks t
     INNER JOIN projects p ON p.id = t.project_id
     WHERE t.assignee_id = $1 AND t.deleted_at IS NULL AND p.deleted_at IS NULL
     GROUP BY p.id, p.name
     ORDER BY count(t.*) DESC, lower(p.name) ASC`,
    [userId],
  );

  return {
    user,
    total: counts?.total ?? 0,
    completed: counts?.completed ?? 0,
    in_progress: counts?.in_progress ?? 0,
    todo: counts?.todo ?? 0,
    overdue: counts?.overdue ?? 0,
    by_project: byProject,
  };
}

export interface MembersOverviewRow extends User {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
}

export async function listMembersWithWorkload(): Promise<MembersOverviewRow[]> {
  return many<MembersOverviewRow>(
    `SELECT
       u.id, u.name, u.email, u.role, u.created_at,
       count(t.*) FILTER (WHERE t.deleted_at IS NULL)::int AS total_tasks,
       count(t.*) FILTER (WHERE t.deleted_at IS NULL AND t.status = 'COMPLETED')::int AS completed_tasks,
       count(t.*) FILTER (WHERE t.deleted_at IS NULL AND t.status <> 'COMPLETED')::int AS pending_tasks,
       count(t.*) FILTER (WHERE t.deleted_at IS NULL AND t.status <> 'COMPLETED' AND t.due_date < CURRENT_DATE)::int AS overdue_tasks
     FROM users u
     LEFT JOIN tasks t ON t.assignee_id = u.id
     GROUP BY u.id
     ORDER BY lower(u.name) ASC`,
  );
}
