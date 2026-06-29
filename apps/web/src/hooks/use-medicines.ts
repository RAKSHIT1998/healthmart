'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { publicApiFetch } from '@/lib/api';
import type { Medicine, MedicineDetailResponse, PaginationMeta } from '@/types';

export interface MedicineFilters {
  q?: string;
  categoryId?: string;
  manufacturerId?: string;
  categoryGroup?: string;
  minPrice?: string;
  maxPrice?: string;
  prescriptionRequired?: string;
  isGeneric?: string;
  inStockOnly?: string;
  sortBy?: string;
  sortOrder?: string;
}

function buildQuery(filters: MedicineFilters, page: number): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, value);
  });
  params.set('page', String(page));
  params.set('limit', '20');
  return params.toString();
}

interface MedicinesResponse {
  items: Medicine[];
  pagination: PaginationMeta;
}

async function fetchMedicinesPage(filters: MedicineFilters, page: number): Promise<MedicinesResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1'}/medicines?${buildQuery(filters, page)}`,
  );
  const json = await response.json();
  return { items: json.data, pagination: json.meta.pagination };
}

export function useMedicineSearch(filters: MedicineFilters) {
  return useInfiniteQuery({
    queryKey: ['medicines', filters],
    queryFn: ({ pageParam }) => fetchMedicinesPage(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined),
  });
}

export function useMedicineDetail(slug: string) {
  return useQuery({
    queryKey: ['medicine', slug],
    queryFn: () => publicApiFetch<MedicineDetailResponse>(`/medicines/slug/${slug}`),
    enabled: !!slug,
  });
}
