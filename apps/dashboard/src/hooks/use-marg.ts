'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/api';
import type { MargSyncLog } from '@/types';

export function useMargLogs(page: number) {
  return useQuery({
    queryKey: ['marg-logs', page],
    queryFn: () => apiFetchWithMeta<MargSyncLog>(`/marg/logs?page=${page}&limit=20`),
  });
}

export function useTriggerMargSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entity?: string) => api.post('/marg/sync', entity ? { entity } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marg-logs'] });
      toast.success('MARG sync triggered');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
