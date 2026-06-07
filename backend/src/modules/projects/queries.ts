import { many, one, query } from '../../lib/query.js';
import type { Project, ProjectStatus, UserRole } from '../../types/index.js';
import type { VisibilitySetting } from '../../lib/settings.js';

export interface ListFilters {
  status?: ProjectStatus;
  search?: string;
  sort?: 'recent' | 'deadline' | 'updated' | 'name';
  page: number;
  limit: number;
  offset: number;
  userId: string;
  userRole: UserRole;
  visibility: VisibilitySetting;
}

function sortClause(sort: ListFilters['sort']): string {
  switch (sort) {
    case 'deadline':
      return 'ORDER BY p.deadline NULLS LAST, p.created_at DESC';
    case 'updated':
      return 'ORDER BY p.updated_at DESC';
    case 'name':
      return 'ORDER BY lower(p.name) ASC';
    case 'recent':
    default:
      return 'ORDER BY p.created_at DESC';
  }
}

function scope(
  userRole: UserRole,
  visibility: VisibilitySetting,
): { sql: string; needsUserId: boolean } {
  if (userRole !== 'TEAM_MEMBER' || visibility === 'ALL') {
    return { sql: '', needsUserId: false };
  }
  return {
    sql: ` AND EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id AND pm.user_id = $__USER__
    )`,
    needsUserId: true,
  };
}

export async function listProjects(f: ListFilters): Promise<{ rows: Project[]; total: number }> {
  const params: unknown[] = [];
  const where: string[] = ['p.deleted_at IS NULL'];
  if (f.status) {
    params.push(f.status);
    where.push(`p.status = $${params.length}`);
  }
  if (f.search) {
    params.push(`%${f.search.toLowerCase()}%`);
    where.push(`lower(p.name) LIKE $${params.length}`);
  }
  const sc = scope(f.userRole, f.visibility);
  let scopeSql = '';
  if (sc.needsUserId) {
    params.push(f.userId);
    scopeSql = sc.sql.replace('$__USER__', `$${params.length}`);
  }

  const baseWhere = `WHERE ${where.join(' AND ')}${scopeSql}`;

  const listSql = `
    SELECT p.id, p.name, p.description, p.deadline, p.status,
           p.created_by_id, p.created_at, p.updated_at
    FROM projects p
    ${baseWhere}
    ${sortClause(f.sort)}
    LIMIT ${f.limit} OFFSET ${f.offset}
  `;
  const countSql = `SELECT count(*)::int AS total FROM projects p ${baseWhere}`;

  const [rows, totalRow] = await Promise.all([
    many<Project>(listSql, params),
    one<{ total: number }>(countSql, params),
  ]);
  return { rows, total: totalRow?.total ?? 0 };
}

export async function findProjectById(id: string, includeDeleted = false): Promise<Project | null> {
  return one<Project>(
    `SELECT id, name, description, deadline, status, created_by_id, created_at, updated_at
     FROM projects
     WHERE id = $1 ${includeDeleted ? '' : 'AND deleted_at IS NULL'}`,
    [id],
  );
}

export async function userBelongsToProject(projectId: string, userId: string): Promise<boolean> {
  const row = await one<{ ok: number }>(
    `SELECT 1 AS ok FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );
  return !!row;
}

export async function insertProject(opts: {
  name: string;
  description?: string;
  deadline?: string;
  status?: ProjectStatus;
  createdById: string;
}): Promise<Project> {
  const row = await one<Project>(
    `INSERT INTO projects (name, description, deadline, status, created_by_id)
     VALUES ($1,$2,$3, COALESCE($4,'ACTIVE')::project_status, $5)
     RETURNING id, name, description, deadline, status, created_by_id, created_at, updated_at`,
    [opts.name, opts.description ?? null, opts.deadline ?? null, opts.status ?? null, opts.createdById],
  );
  return row!;
}

export async function updateProject(
  id: string,
  patch: { name?: string; description?: string; deadline?: string; status?: ProjectStatus },
): Promise<Project | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.name !== undefined)        { params.push(patch.name);        sets.push(`name = $${params.length}`); }
  if (patch.description !== undefined) { params.push(patch.description); sets.push(`description = $${params.length}`); }
  if (patch.deadline !== undefined)    { params.push(patch.deadline);    sets.push(`deadline = $${params.length}`); }
  if (patch.status !== undefined)      { params.push(patch.status);      sets.push(`status = $${params.length}::project_status`); }
  if (sets.length === 0) {
    return findProjectById(id);
  }
  params.push(id);
  const sql = `
    UPDATE projects SET ${sets.join(', ')}
    WHERE id = $${params.length} AND deleted_at IS NULL
    RETURNING id, name, description, deadline, status, created_by_id, created_at, updated_at
  `;
  return one<Project>(sql, params);
}

export async function softDeleteProject(id: string): Promise<boolean> {
  const r = await query(
    `UPDATE projects SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function restoreProject(id: string): Promise<Project | null> {
  return one<Project>(
    `UPDATE projects SET deleted_at = NULL WHERE id = $1
     RETURNING id, name, description, deadline, status, created_by_id, created_at, updated_at`,
    [id],
  );
}
