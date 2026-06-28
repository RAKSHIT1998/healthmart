'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { publicApiFetch } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Category, Manufacturer } from '@/types';
import type { MedicineFilters } from '@/hooks/use-medicines';

interface ShopFiltersProps {
  filters: MedicineFilters;
  onChange: (filters: Partial<MedicineFilters>) => void;
  onReset: () => void;
}

export function ShopFilters({ filters, onChange, onReset }: ShopFiltersProps) {
  // Collapsed by default on mobile so filters don't push the product grid below the fold —
  // always expanded on lg+ regardless of this state (see the `lg:block` override below).
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => publicApiFetch<Category[]>('/catalog/categories'),
  });
  const { data: manufacturers } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => publicApiFetch<Manufacturer[]>('/catalog/manufacturers'),
  });

  const activeCount = [
    filters.categoryId,
    filters.manufacturerId,
    filters.minPrice,
    filters.maxPrice,
    filters.prescriptionRequired,
    filters.inStockOnly,
  ].filter(Boolean).length;

  return (
    <aside className="w-full space-y-6 lg:w-64">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-semibold lg:pointer-events-none"
        >
          <SlidersHorizontal className="h-4 w-4 lg:hidden" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">{activeCount}</span>
          )}
          <ChevronDown className={cn('h-4 w-4 transition-transform lg:hidden', mobileOpen && 'rotate-180')} />
        </button>
        <button onClick={onReset} className="text-xs font-medium text-primary hover:underline">
          Clear all
        </button>
      </div>

      <div className={cn('space-y-6', !mobileOpen && 'hidden lg:block')}>
        <div>
          <Label className="mb-2 block text-xs uppercase text-muted-foreground">Category</Label>
          <div className="flex flex-col gap-1">
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => onChange({ categoryId: filters.categoryId === category.id ? undefined : category.id })}
                className={cn(
                  'rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary',
                  filters.categoryId === category.id && 'bg-primary/10 font-medium text-primary',
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-xs uppercase text-muted-foreground">Brand</Label>
          <div className="flex max-h-44 flex-col gap-1 overflow-y-auto">
            {manufacturers?.map((m) => (
              <button
                key={m.id}
                onClick={() => onChange({ manufacturerId: filters.manufacturerId === m.id ? undefined : m.id })}
                className={cn(
                  'rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary',
                  filters.manufacturerId === m.id && 'bg-primary/10 font-medium text-primary',
                )}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-xs uppercase text-muted-foreground">Price Range (₹)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice ?? ''}
              onChange={(e) => onChange({ minPrice: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice ?? ''}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.prescriptionRequired === 'false'}
              onChange={(e) => onChange({ prescriptionRequired: e.target.checked ? 'false' : undefined })}
            />
            No prescription needed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.inStockOnly === 'true'}
              onChange={(e) => onChange({ inStockOnly: e.target.checked ? 'true' : undefined })}
            />
            In stock only
          </label>
        </div>

        <Button variant="outline" size="sm" className="w-full lg:hidden" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
    </aside>
  );
}
