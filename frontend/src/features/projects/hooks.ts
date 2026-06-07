import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { ProjectListParams, ProjectInput } from './api';

const KEYS = {
  list: (params: ProjectListParams) => ['projects', 'list', params] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => api.listProjects(params),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: id ? KEYS.detail(id) : ['projects', 'detail', 'none'],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['projects'] });
  qc.invalidateQueries({ queryKey: ['activity'] });
  qc.invalidateQueries({ queryKey: ['analytics'] });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => api.createProject(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProjectInput>) => api.updateProject(id, input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRestoreProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.restoreProject(id),
    onSuccess: () => invalidateAll(qc),
  });
}
