'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { CartTotals } from '@/types';

export function useCart() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get<CartTotals>('/cart'),
    enabled: !!accessToken,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ medicineId, quantity = 1, variantLabel }: { medicineId: string; quantity?: number; variantLabel?: string }) =>
      api.post<CartTotals>('/cart/items', { medicineId, quantity, variantLabel }),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      toast.success('Added to cart');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ medicineId, quantity, variantLabel }: { medicineId: string; quantity: number; variantLabel?: string }) =>
      api.patch<CartTotals>(`/cart/items/${medicineId}${variantLabel ? `?variantLabel=${encodeURIComponent(variantLabel)}` : ''}`, { quantity }),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ medicineId, variantLabel }: { medicineId: string; variantLabel?: string }) =>
      api.delete<CartTotals>(`/cart/items/${medicineId}${variantLabel ? `?variantLabel=${encodeURIComponent(variantLabel)}` : ''}`),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<CartTotals>('/cart/coupon', { code }),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      toast.success('Coupon applied');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<CartTotals>('/cart/coupon'),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });
}
