'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/api';
import type { AdminOrder } from '@/types';

export function useMyDeliveries() {
  return useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => apiFetchWithMeta<AdminOrder>('/drivers/me/orders?page=1&limit=20'),
  });
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) => api.patch('/drivers/me/availability', { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
      toast.success('Availability updated');
    },
  });
}

export function useUpdateMyLocation() {
  return useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) => api.patch('/drivers/me/location', { lat, lng }),
  });
}

export function useVerifyDeliveryOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, otp }: { orderId: string; otp: string }) => api.post(`/orders/${orderId}/delivery-otp/verify`, { otp }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
      toast.success('Delivery confirmed!');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useResendDeliveryOtp() {
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/orders/${orderId}/delivery-otp/resend`),
    onSuccess: () => toast.success('OTP resent to customer'),
  });
}
