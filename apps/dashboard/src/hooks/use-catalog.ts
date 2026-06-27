'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Branch, Category, Manufacturer } from '@/types';

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/catalog/categories', { auth: false }) });
}

export function useManufacturers() {
  return useQuery({ queryKey: ['manufacturers'], queryFn: () => api.get<Manufacturer[]>('/catalog/manufacturers', { auth: false }) });
}

export function useBranches() {
  return useQuery({ queryKey: ['branches'], queryFn: () => api.get<Branch[]>('/catalog/branches', { auth: false }) });
}
