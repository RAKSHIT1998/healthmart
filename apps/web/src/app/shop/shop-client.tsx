'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useMedicineSearch, type MedicineFilters } from '@/hooks/use-medicines';
import { ShopFilters } from '@/components/product/shop-filters';
import { SortDropdown } from '@/components/product/sort-dropdown';
import { ProductCard } from '@/components/product/product-card';
import { Skeleton } from '@/components/ui/skeleton';

export function ShopClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters: MedicineFilters = {
    q: searchParams.get('q') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
    manufacturerId: searchParams.get('manufacturerId') ?? undefined,
    categoryGroup: searchParams.get('categoryGroup') ?? undefined,
    minPrice: searchParams.get('minPrice') ?? undefined,
    maxPrice: searchParams.get('maxPrice') ?? undefined,
    prescriptionRequired: searchParams.get('prescriptionRequired') ?? undefined,
    inStockOnly: searchParams.get('inStockOnly') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? 'relevance',
    sortOrder: searchParams.get('sortOrder') ?? 'desc',
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMedicineSearch(filters);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function updateFilters(partial: Partial<MedicineFilters>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(partial).forEach(([key, value]) => {
      if (value === undefined || value === '') params.delete(key);
      else params.set(key, value);
    });
    router.push(`/shop?${params.toString()}`);
  }

  function resetFilters() {
    router.push('/shop');
  }

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{filters.q ? `Results for "${filters.q}"` : 'Shop Medicines'}</h1>
        <p className="text-sm text-muted-foreground">{total} products found</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <ShopFilters filters={filters} onChange={updateFilters} onReset={resetFilters} />

        <div className="flex-1">
          <div className="mb-4 flex justify-end">
            <SortDropdown value={filters.sortBy ?? 'relevance'} onChange={(sortBy) => updateFilters({ sortBy })} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium">No medicines found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {items.map((medicine) => (
                  <ProductCard key={medicine.id} medicine={medicine} />
                ))}
              </div>
              <div ref={sentinelRef} className="flex justify-center py-8">
                {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
