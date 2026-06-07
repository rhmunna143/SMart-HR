import { many } from '../../lib/query.js';
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
