'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import type { Driver } from '@/types';

export function useAvailableDrivers(branchId: string) {
  return useQuery({
    queryKey: ['drivers', branchId],
    queryFn: () => api.get<Driver[]>(`/drivers/available/${branchId}`),
    enabled: !!branchId,
  });
}

/** All drivers for a branch regardless of online/offline status, ranked by delivery volume. */
export function useAllDrivers(branchId: string) {
  return useQuery({
    queryKey: ['drivers-all', branchId],
    queryFn: () => api.get<Driver[]>(`/drivers/branch/${branchId}`),
    enabled: !!branchId,
  });
}

export interface CreateDriverInput {
  name: string;
  phone: string;
  email?: string;
  vehicleType: 'bike' | 'scooter' | 'bicycle' | 'car';
  vehicleNumber?: string;
  branchId: string;
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDriverInput) => api.post<Driver>('/drivers', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver registered');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
