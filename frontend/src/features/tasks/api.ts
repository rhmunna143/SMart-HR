import { api } from '@/lib/api';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import type { PageMeta } from '@/lib/api';

export interface TaskListParams {
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

export async function listTasks(
  params: TaskListParams,
): Promise<{ rows: Task[]; meta: PageMeta }> {
  const { data, meta } = await api.getList<Task[]>('/tasks', {
    query: params as Record<string, string | number | undefined>,
  });
  return { rows: data, meta };
}

export async function getTask(id: string): Promise<Task> {
  return api.get<Task>(`/tasks/${id}`);
}

export interface TaskInput {
  project_id: string;
  title: string;
  description?: string;
  assignee_id?: string | null;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export async function createTask(input: TaskInput): Promise<Task> {
  return api.post<Task>('/tasks', input);
}

export async function updateTask(
  id: string,
  input: Partial<Omit<TaskInput, 'project_id'>>,
): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}`, input);
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}/status`, { status });
}

export async function deleteTask(id: string): Promise<{ id: string; deleted: true }> {
  return api.del<{ id: string; deleted: true }>(`/tasks/${id}`);
}

export async function restoreTask(id: string): Promise<Task> {
  return api.post<Task>(`/tasks/${id}/restore`);
}
