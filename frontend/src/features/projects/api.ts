import { api } from '@/lib/api';
import type { Project, ProjectStatus } from '@/types';
import type { PageMeta } from '@/lib/api';

export interface ProjectListParams {
  status?: ProjectStatus;
  search?: string;
  sort?: 'recent' | 'deadline' | 'updated' | 'name';
  page?: number;
  limit?: number;
}

export interface ProjectListResult {
  rows: Project[];
  meta: PageMeta;
}

export async function listProjects(params: ProjectListParams): Promise<ProjectListResult> {
  const { data, meta } = await api.getList<Project[]>('/projects', {
    query: params as Record<string, string | number | undefined>,
  });
  return { rows: data, meta };
}

export async function getProject(id: string): Promise<Project> {
  return api.get<Project>(`/projects/${id}`);
}

export interface ProjectInput {
  name: string;
  description?: string;
  deadline?: string;
  status?: ProjectStatus;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  return api.post<Project>('/projects', input);
}

export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
  return api.patch<Project>(`/projects/${id}`, input);
}

export async function deleteProject(id: string): Promise<{ id: string; deleted: true }> {
  return api.del<{ id: string; deleted: true }>(`/projects/${id}`);
}

export async function restoreProject(id: string): Promise<Project> {
  return api.post<Project>(`/projects/${id}/restore`);
}
