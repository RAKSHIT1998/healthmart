'use client';

import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product/product-card';
import type { Medicine } from '@/types';

export default function WishlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get<{ medicineIds: Medicine[] }>('/wishlist'),
  });

  const medicines = data?.medicineIds ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Wishlist</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : medicines.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <Heart className="h-8 w-8" />
          <p>Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {medicines.map((medicine) => (
            <ProductCard key={medicine.id} medicine={medicine} />
          ))}
        </div>
      )}
    </div>
  );
}
