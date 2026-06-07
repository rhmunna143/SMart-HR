import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateVisibility } from './api';
import type { VisibilitySetting } from './api';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });
}

export function useUpdateVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: VisibilitySetting) => updateVisibility(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
