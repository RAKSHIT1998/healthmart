'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/api';
import type { ServiceablePincode } from '@/types';

export function useServiceablePincodes(page: number) {
  return useQuery({
    queryKey: ['serviceable-pincodes', page],
    queryFn: () => apiFetchWithMeta<ServiceablePincode>(`/serviceability?page=${page}&limit=20`),
  });
}

export interface CreateServiceablePincodeInput {
  pincode: string;
  branchId: string;
  estimatedDeliveryMinutes: number;
  isActive?: boolean;
}

export function useCreateServiceablePincode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceablePincodeInput) => api.post<ServiceablePincode>('/serviceability', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceable-pincodes'] });
      toast.success('Pincode added');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateServiceablePincode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<ServiceablePincode>(`/serviceability/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceable-pincodes'] });
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDeleteServiceablePincode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/serviceability/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceable-pincodes'] });
      toast.success('Removed');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export interface CityPincodeResult {
  pincode: string;
  area: string;
  district: string;
  state: string;
  districtMatch: boolean;
}

export function useLookupCityPincodes() {
  return useMutation({
    mutationFn: (city: string) => api.get<CityPincodeResult[]>(`/serviceability/lookup-city?city=${encodeURIComponent(city)}`),
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export interface BulkCreateServiceablePincodesInput {
  pincodes: string[];
  branchId: string;
  estimatedDeliveryMinutes: number;
}

export function useBulkCreateServiceablePincodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkCreateServiceablePincodesInput) =>
      api.post<{ created: number; skipped: number; total: number }>('/serviceability/bulk', input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['serviceable-pincodes'] });
      toast.success(`${result.created} pincode(s) added${result.skipped ? `, ${result.skipped} already existed` : ''}`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
