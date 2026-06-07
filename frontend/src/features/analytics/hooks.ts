import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary } from './api';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: getAnalyticsSummary,
    staleTime: 30_000, // refresh every 30 s
  });
}
