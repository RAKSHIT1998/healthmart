'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetchWithMeta, api, ApiClientError } from '@/lib/api';
import type { AdminOrder } from '@/types';

export function useAdminOrders(page: number, status?: string) {
  return useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: () => apiFetchWithMeta<AdminOrder>(`/orders/admin/all?page=${page}&limit=20${status ? `&status=${status}` : ''}`),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.patch<AdminOrder>(`/orders/admin/${id}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, driverId }: { id: string; driverId: string }) =>
      api.patch<AdminOrder>(`/orders/admin/${id}/assign-driver`, { driverId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Driver assigned');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
