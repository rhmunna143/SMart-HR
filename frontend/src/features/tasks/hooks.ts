import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { TaskListParams, TaskInput } from './api';
import type { TaskStatus } from '@/types';

const KEYS = {
  list: (params: TaskListParams) => ['tasks', 'list', params] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
};

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => api.listTasks(params),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: id ? KEYS.detail(id) : ['tasks', 'detail', 'none'],
    queryFn: () => api.getTask(id!),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => api.createTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Omit<TaskInput, 'project_id'>>) => api.updateTask(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api.updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useRestoreTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.restoreTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
