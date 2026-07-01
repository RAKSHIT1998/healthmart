'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/admin-api';
import type { Medicine } from '@/types/admin';

export function useAdminMedicines(page: number, search: string) {
  return useQuery({
    queryKey: ['admin-medicines', page, search],
    queryFn: () =>
      apiFetchWithMeta<Medicine>(`/medicines?page=${page}&limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}`, {
        auth: false,
      }),
  });
}

export function useCreateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => api.post<Medicine>('/medicines', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      toast.success('Medicine created');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => api.patch<Medicine>(`/medicines/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      toast.success('Medicine updated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDeactivateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/medicines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      toast.success('Medicine deactivated');
    },
  });
}
