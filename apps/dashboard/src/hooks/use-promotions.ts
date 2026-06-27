'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/api';

export interface FlashSaleItem {
  medicineId: string;
  flashPrice: number;
}

export interface FlashSale {
  id: string;
  name: string;
  bannerImage?: string;
  startAt: string;
  endAt: string;
  items: FlashSaleItem[];
  isActive: boolean;
}

export interface GiftCard {
  id: string;
  code: string;
  initialValue: number;
  balance: number;
  redeemedBy?: string;
  expiresAt?: string;
  createdAt: string;
}

export function useFlashSales() {
  return useQuery({ queryKey: ['admin-flash-sales'], queryFn: () => api.get<FlashSale[]>('/promotions/flash-sales') });
}

export interface CreateFlashSaleInput {
  name: string;
  startAt: string;
  endAt: string;
  items: FlashSaleItem[];
  isActive: boolean;
}

export function useCreateFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFlashSaleInput) => api.post<FlashSale>('/promotions/flash-sales', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] });
      toast.success('Flash sale created');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useToggleFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch<FlashSale>(`/promotions/flash-sales/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] }),
  });
}

export function useIssuedGiftCards(page: number) {
  return useQuery({
    queryKey: ['issued-gift-cards', page],
    queryFn: () => apiFetchWithMeta<GiftCard>(`/promotions/gift-cards?page=${page}&limit=20`),
  });
}

export function useIssueGiftCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { initialValue: number; issuedToEmail?: string; issuedToPhone?: string; notes?: string }) =>
      api.post<GiftCard>('/promotions/gift-cards/issue', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issued-gift-cards'] });
      toast.success('Gift card issued');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
