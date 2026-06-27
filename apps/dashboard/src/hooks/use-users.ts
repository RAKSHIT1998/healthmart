'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/api';
import type { StaffUser } from '@/types';

export function useStaffList(page: number) {
  return useQuery({ queryKey: ['staff-list', page], queryFn: () => apiFetchWithMeta<StaffUser>(`/users/staff?page=${page}&limit=20`) });
}

export function useCustomerList(page: number, search?: string) {
  return useQuery({
    queryKey: ['customer-list', page, search],
    queryFn: () => apiFetchWithMeta<StaffUser>(`/users/customers?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  });
}

export interface CreateStaffInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'manager' | 'pharmacist' | 'inventory_manager' | 'delivery_boy';
  branchId?: string;
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStaffInput) => api.post('/auth/staff/register', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      toast.success('Staff account created');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) =>
      api.patch(`/users/${id}/${activate ? 'reactivate' : 'deactivate'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-list'] });
    },
  });
}
