import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addProjectMember,
  getMemberWorkload,
  listMembers,
  listMembersWithWorkload,
  listProjectMembers,
  removeProjectMember,
} from './api';

export function useMembers(search?: string) {
  return useQuery({
    queryKey: ['members', { search: search ?? '' }],
    queryFn: () => listMembers(search),
    staleTime: 60_000,
  });
}

export function useMembersOverview() {
  return useQuery({
    queryKey: ['members', 'overview'],
    queryFn: () => listMembersWithWorkload(),
    staleTime: 30_000,
  });
}

export function useMemberWorkload(id: string | null | undefined) {
  return useQuery({
    queryKey: ['members', id, 'workload'],
    queryFn: () => getMemberWorkload(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useProjectMembers(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => listProjectMembers(projectId as string),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useAddProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => addProjectMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      qc.invalidateQueries({ queryKey: ['members', 'overview'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      qc.invalidateQueries({ queryKey: ['members', 'overview'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}
