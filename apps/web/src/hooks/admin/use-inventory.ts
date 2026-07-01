'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/admin-api';
import type { Batch, InventoryItem, InventoryMovement } from '@/types/admin';

export function useAllInventory(page: number, branchId?: string) {
  return useQuery({
    queryKey: ['all-inventory', page, branchId],
    queryFn: () =>
      apiFetchWithMeta<InventoryItem>(`/inventory?page=${page}&limit=20${branchId ? `&branchId=${branchId}` : ''}`),
  });
}

export function useInventoryMovements(page: number, branchId?: string) {
  return useQuery({
    queryKey: ['inventory-movements', page, branchId],
    queryFn: () =>
      apiFetchWithMeta<InventoryMovement>(
        `/inventory/movements?page=${page}&limit=20${branchId ? `&branchId=${branchId}` : ''}`,
      ),
  });
}

export function useLowStock() {
  return useQuery({ queryKey: ['low-stock'], queryFn: () => api.get<InventoryItem[]>('/inventory/low-stock') });
}

export function useExpiringSoon() {
  return useQuery({ queryKey: ['expiring-soon'], queryFn: () => api.get<Batch[]>('/inventory/expiring-soon') });
}

export function useInventoryValue() {
  return useQuery({ queryKey: ['inventory-value'], queryFn: () => api.get<{ value: number }>('/inventory/value') });
}

export interface ReceivePurchaseInput {
  medicineId: string;
  branchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  supplierId?: string;
  rackNumber?: string;
  warehouse?: string;
}

export function useReceivePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReceivePurchaseInput) => api.post<Batch>('/inventory/purchases', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-soon'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-value'] });
      queryClient.invalidateQueries({ queryKey: ['all-inventory'] });
      toast.success('Stock received and batch created');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export interface WriteOffBatchInput {
  batchId: string;
  quantity: number;
  reason: 'damaged' | 'expired';
  notes?: string;
}

export function useWriteOffBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, ...body }: WriteOffBatchInput) => api.post<Batch>(`/inventory/batches/${batchId}/write-off`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiring-soon'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-value'] });
      queryClient.invalidateQueries({ queryKey: ['all-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('Batch written off');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateLowStockThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ medicineId, branchId, lowStockThreshold }: { medicineId: string; branchId: string; lowStockThreshold: number }) =>
      api.patch<InventoryItem>(`/inventory/${medicineId}/${branchId}/low-stock-threshold`, { lowStockThreshold }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      toast.success('Low stock threshold updated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
