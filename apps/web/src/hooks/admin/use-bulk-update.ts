'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiUpload, ApiClientError } from '@/lib/admin-api';

export interface BulkUpdateFieldSet {
  name?: string;
  mrp?: number;
  sellingPrice?: number;
  gstPercentage?: number;
  hsnCode?: string;
  packSize?: string;
  isActive?: boolean;
  stockQuantity?: number;
}

export interface BulkUpdatePreviewRow {
  rowIndex: number;
  identifier: string;
  matchedMedicineId: string | null;
  matchedMedicineName: string | null;
  matchStatus: 'matched' | 'not_found' | 'ambiguous';
  current: BulkUpdateFieldSet;
  proposed: BulkUpdateFieldSet;
  changedFields: string[];
  errors: string[];
}

export function useBulkUpdatePreview() {
  return useMutation({
    mutationFn: ({ file, branchId }: { file: File; branchId: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('branchId', branchId);
      return apiUpload<BulkUpdatePreviewRow[]>('/inventory/bulk-update/preview', formData);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export interface CommitBulkUpdateRow {
  medicineId: string;
  name?: string;
  mrp?: number;
  sellingPrice?: number;
  gstPercentage?: number;
  hsnCode?: string;
  packSize?: string;
  isActive?: boolean;
  stockQuantity?: number;
}

export interface CommitBulkUpdateResult {
  updated: number;
  skipped: number;
  total: number;
  errors: { row: number; message: string }[];
}

export function useCommitBulkUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, rows }: { branchId: string; rows: CommitBulkUpdateRow[] }) =>
      api.post<CommitBulkUpdateResult>('/inventory/bulk-update/commit', { branchId, rows }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['all-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-value'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      toast.success(`${result.updated} updated${result.skipped ? `, ${result.skipped} skipped` : ''}`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
