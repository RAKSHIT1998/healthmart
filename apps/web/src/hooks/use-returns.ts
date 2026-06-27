'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import type { ReturnRequest } from '@/types';

export interface CreateReturnPayload {
  orderId: string;
  items: Array<{ medicineId: string; quantity: number }>;
  reasonCategory: string;
  reason?: string;
}

export function useMyReturns(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['returns', page, limit],
    queryFn: () => api.get<ReturnRequest[]>(`/returns/mine?page=${page}&limit=${limit}`),
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReturnPayload) => api.post<ReturnRequest>('/returns', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Return request submitted');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
