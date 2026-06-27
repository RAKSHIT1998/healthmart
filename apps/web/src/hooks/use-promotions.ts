'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, publicApiFetch, ApiClientError } from '@/lib/api';

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
}

export function useActiveFlashSales() {
  return useQuery({
    queryKey: ['active-flash-sales'],
    queryFn: () => publicApiFetch<FlashSale[]>('/promotions/flash-sales/active'),
    staleTime: 30_000,
  });
}

export function useMyReferralCode() {
  return useQuery({
    queryKey: ['my-referral-code'],
    queryFn: () => api.get<{ code: string }>('/promotions/referrals/my-code'),
  });
}

export function useApplyReferralCode() {
  return useMutation({
    mutationFn: (code: string) => api.post('/promotions/referrals/apply', { code }),
    onSuccess: () => toast.success('Referral code applied! Your bonus will be credited after your first delivered order.'),
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useRedeemGiftCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<{ wallet: { balance: number } }>('/promotions/gift-cards/redeem', { code }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success(`Gift card redeemed! New wallet balance: ₹${data.wallet.balance}`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
