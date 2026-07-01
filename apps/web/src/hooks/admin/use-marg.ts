'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, apiUpload, ApiClientError } from '@/lib/admin-api';
import type { MargSyncLog } from '@/types/admin';

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

export function useUploadMargFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entity, file }: { entity: string; file: File }) => {
      const formData = new FormData();
      formData.append('entity', entity);
      formData.append('file', file);
      return apiUpload<MargSyncLog>('/marg/upload', formData);
    },
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: ['marg-logs'] });
      if (log.recordsFailed > 0) {
        toast.warning(`Synced with ${log.recordsFailed} row(s) failed — check the log for details`);
      } else {
        toast.success(`Synced ${log.recordsProcessed} record(s) from file`);
      }
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
