'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/api';
import type { Prescription } from '@/types';

export function usePendingPrescriptions(page: number) {
  return useQuery({
    queryKey: ['pending-prescriptions', page],
    queryFn: () => apiFetchWithMeta<Prescription>(`/prescriptions/pending?page=${page}&limit=20`),
  });
}

export function useReviewPrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: 'approved' | 'rejected'; rejectionReason?: string }) =>
      api.patch(`/prescriptions/${id}/review`, { status, rejectionReason, matchedMedicineIds: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-prescriptions'] });
      toast.success('Prescription reviewed');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
