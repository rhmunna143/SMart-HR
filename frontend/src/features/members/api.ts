import { api } from '@/lib/api';
import type { User, UserRole } from '@/types';

export async function listMembers(search?: string): Promise<User[]> {
  return api.get<User[]>('/members', { query: { search } });
}

export interface MemberOverview extends User {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
}

export async function listMembersWithWorkload(): Promise<MemberOverview[]> {
  return api.get<MemberOverview[]>('/members', { query: { withWorkload: 'true' } });
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

export async function getMemberWorkload(id: string): Promise<WorkloadSummary> {
  return api.get<WorkloadSummary>(`/members/${id}/workload`);
}

export async function listProjectMembers(projectId: string): Promise<User[]> {
  return api.get<User[]>(`/projects/${projectId}/members`);
}

export async function addProjectMember(projectId: string, userId: string): Promise<User> {
  return api.post<User>(`/projects/${projectId}/members`, { user_id: userId });
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await api.del(`/projects/${projectId}/members/${userId}`);
}

// Re-export for convenience
export type { UserRole };
