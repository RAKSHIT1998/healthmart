'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import type { Branch, Category, Manufacturer } from '@/types';

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/catalog/categories', { auth: false }) });
}

export function useManufacturers() {
  return useQuery({ queryKey: ['manufacturers'], queryFn: () => api.get<Manufacturer[]>('/catalog/manufacturers', { auth: false }) });
}

export function useBranches() {
  return useQuery({ queryKey: ['branches'], queryFn: () => api.get<Branch[]>('/catalog/branches', { auth: false }) });
}

export function useAdminBranches() {
  return useQuery({ queryKey: ['admin-branches'], queryFn: () => api.get<Branch[]>('/catalog/branches/admin') });
}

export interface BranchInput {
  name: string;
  code: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  gstin?: string;
  isMainBranch: boolean;
}

function invalidateBranchQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
  queryClient.invalidateQueries({ queryKey: ['branches'] });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BranchInput) => api.post<Branch>('/catalog/branches', input),
    onSuccess: () => {
      invalidateBranchQueries(queryClient);
      toast.success('Branch created');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BranchInput> & { isActive?: boolean } }) =>
      api.patch<Branch>(`/catalog/branches/${id}`, input),
    onSuccess: () => {
      invalidateBranchQueries(queryClient);
      toast.success('Branch updated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDeactivateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalog/branches/${id}`),
    onSuccess: () => {
      invalidateBranchQueries(queryClient);
      toast.success('Branch deactivated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
