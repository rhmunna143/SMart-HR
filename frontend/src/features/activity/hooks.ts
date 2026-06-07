import { useQuery } from '@tanstack/react-query';
import { listActivity } from './api';

export function useActivity(limit = 20) {
  return useQuery({
    queryKey: ['activity', { limit }],
    queryFn: () => listActivity(limit),
    staleTime: 15_000,
  });
}
