import { useQuery } from '@tanstack/react-query';
import { listMembers } from './api';

export function useMembers(search?: string) {
  return useQuery({
    queryKey: ['members', { search: search ?? '' }],
    queryFn: () => listMembers(search),
    staleTime: 60_000,
  });
}
