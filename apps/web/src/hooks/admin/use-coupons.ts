'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/admin-api';
import type { Coupon } from '@/types/admin';

export function useCoupons() {
  return useQuery({ queryKey: ['coupons'], queryFn: () => api.get<Coupon[]>('/coupons', { auth: false }) });
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  type: 'flat' | 'percentage' | 'free_delivery';
  value: number;
  minOrderValue: number;
  usageLimitPerUser: number;
  validFrom: string;
  validTill: string;
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCouponInput) => api.post<Coupon>('/coupons', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deactivated');
    },
  });
}
