'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/admin-api';

export interface SalesReportRow {
  orderNumber: string;
  date: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}

export interface GstReportRow {
  invoiceNumber: string;
  date: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  totalAmount: number;
  isInterState: boolean;
}

export interface StockReportRow {
  medicine: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  sellingPrice: number;
  stockValue: number;
}

export interface ExpiryReportRow {
  medicine: string;
  batchNumber: string;
  expiryDate: string;
  quantityRemaining: number;
}

export function useSalesReport(from: string, to: string, branchId?: string) {
  return useQuery({
    queryKey: ['report-sales', from, to, branchId],
    queryFn: () =>
      api.get<SalesReportRow[]>(`/reports/sales?from=${from}&to=${to}${branchId ? `&branchId=${branchId}` : ''}`),
  });
}

export function useGstReport(from: string, to: string) {
  return useQuery({
    queryKey: ['report-gst', from, to],
    queryFn: () => api.get<GstReportRow[]>(`/reports/gst?from=${from}&to=${to}`),
  });
}

export function useStockReport(branchId?: string) {
  return useQuery({
    queryKey: ['report-stock', branchId],
    queryFn: () => api.get<StockReportRow[]>(`/reports/stock${branchId ? `?branchId=${branchId}` : ''}`),
  });
}

export function useExpiryReport(branchId?: string, days?: number) {
  return useQuery({
    queryKey: ['report-expiry', branchId, days],
    queryFn: () =>
      api.get<ExpiryReportRow[]>(
        `/reports/expiry?${branchId ? `branchId=${branchId}&` : ''}${days ? `days=${days}` : ''}`,
      ),
  });
}
