'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';

export interface MedicineRequest {
  id: string;
  medicineName: string;
  notes?: string;
  status: 'pending' | 'sourcing' | 'added' | 'declined';
  adminNotes?: string;
  createdAt: string;
}

export interface CreateMedicineRequestPayload {
  medicineName: string;
  notes?: string;
}

export function useMyMedicineRequests(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['medicine-requests', 'mine', page, limit],
    queryFn: () => api.get<MedicineRequest[]>(`/medicine-requests/mine?page=${page}&limit=${limit}`),
  });
}

export function useCreateMedicineRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMedicineRequestPayload) => api.post<MedicineRequest>('/medicine-requests', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-requests'] });
      toast.success("Thanks! We'll look into sourcing this and let you know.");
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
