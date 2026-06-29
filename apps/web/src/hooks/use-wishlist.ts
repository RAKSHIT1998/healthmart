'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Medicine } from '@/types';

interface WishlistResponse {
  medicineIds: Medicine[];
}

export function useWishlist() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get<WishlistResponse>('/wishlist'),
    enabled: !!accessToken,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (medicineId: string) => api.post<WishlistResponse>(`/wishlist/${medicineId}`),
    onSuccess: (data) => {
      queryClient.setQueryData(['wishlist'], data);
      toast.success('Added to wishlist');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (medicineId: string) => api.delete<WishlistResponse>(`/wishlist/${medicineId}`),
    onSuccess: (data) => {
      queryClient.setQueryData(['wishlist'], data);
      toast.success('Removed from wishlist');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
