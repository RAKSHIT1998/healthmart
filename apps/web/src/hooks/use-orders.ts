'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import type { CheckoutResult, Order } from '@/types';

export interface CheckoutPayload {
  addressId: string;
  deliverySlot: { type: 'standard' | 'express' | 'scheduled'; date?: string };
  paymentMethod: 'cashfree' | 'cod' | 'wallet';
  prescriptionIds: string[];
  couponCode?: string;
  useWalletBalance?: boolean;
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckoutPayload) =>
      api.post<CheckoutResult>('/orders/checkout', { ...payload, returnUrlBase: window.location.origin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useMyOrders(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['orders', page, limit],
    queryFn: () => api.get<Order[]>(`/orders?page=${page}&limit=${limit}`),
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get<Order>(`/orders/${orderId}`),
    enabled: !!orderId,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      api.post<Order>(`/orders/${orderId}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
