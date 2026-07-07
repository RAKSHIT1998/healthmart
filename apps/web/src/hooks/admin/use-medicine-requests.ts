'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/admin-api';

export interface AdminMedicineRequest {
  id: string;
  medicineName: string;
  notes?: string;
  status: 'pending' | 'sourcing' | 'added' | 'declined';
  adminNotes?: string;
  userId: { id: string; name: string; phone?: string; email?: string } | string;
  createdAt: string;
}

export function useAllMedicineRequests(page: number, status?: string) {
  return useQuery({
    queryKey: ['medicine-requests-all', page, status],
    queryFn: () =>
      apiFetchWithMeta<AdminMedicineRequest>(`/medicine-requests?page=${page}&limit=20${status ? `&status=${status}` : ''}`),
  });
}

export interface UpdateMedicineRequestInput {
  id: string;
  status: 'pending' | 'sourcing' | 'added' | 'declined';
  adminNotes?: string;
}

export function useUpdateMedicineRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateMedicineRequestInput) => api.patch<AdminMedicineRequest>(`/medicine-requests/${id}/status`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-requests-all'] });
      toast.success('Request updated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
