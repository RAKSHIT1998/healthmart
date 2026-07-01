'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/admin-api';
import type { ReturnRequest } from '@/types/admin';

export function useReturnQueue(page: number) {
  return useQuery({
    queryKey: ['returns-pending', page],
    queryFn: () => apiFetchWithMeta<ReturnRequest>(`/returns/pending?page=${page}&limit=20`),
  });
}

export function useAllReturns(page: number, status?: string) {
  return useQuery({
    queryKey: ['returns-all', page, status],
    queryFn: () => apiFetchWithMeta<ReturnRequest>(`/returns?page=${page}&limit=20${status ? `&status=${status}` : ''}`),
  });
}

export interface ProcessReturnInput {
  id: string;
  action: 'approve' | 'reject';
  refundMethod?: 'wallet' | 'original_payment';
  rejectionReason?: string;
}

export function useProcessReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ProcessReturnInput) => api.patch<ReturnRequest>(`/returns/${id}/process`, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['returns-pending'] });
      queryClient.invalidateQueries({ queryKey: ['returns-all'] });
      queryClient.invalidateQueries({ queryKey: ['all-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success(variables.action === 'approve' ? 'Return approved and refunded' : 'Return rejected');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
