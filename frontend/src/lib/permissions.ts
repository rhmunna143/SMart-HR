import type { User, UserRole } from '@/types';

export const isAdmin = (u: Pick<User, 'role'> | null | undefined): boolean =>
  u?.role === 'ADMIN';

export const canManage = (
  u: Pick<User, 'role'> | null | undefined,
  ...roles: UserRole[]
): boolean => (u ? roles.includes(u.role) : false);

export const canManageProjects = (u: Pick<User, 'role'> | null | undefined) =>
  canManage(u, 'ADMIN', 'PROJECT_MANAGER');

export const canManageTasks = (u: Pick<User, 'role'> | null | undefined) =>
  canManage(u, 'ADMIN', 'PROJECT_MANAGER');
