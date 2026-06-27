'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAddToCart } from '@/hooks/use-cart';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import type { Medicine } from '@/types';

export function ProductCard({ medicine }: { medicine: Medicine }) {
  const addToCart = useAddToCart();
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const discount = medicine.discountPercentage ?? Math.round(((medicine.mrp - medicine.sellingPrice) / medicine.mrp) * 100);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!accessToken) {
      router.push('/login');
      return;
    }
    addToCart.mutate({ medicineId: medicine.id, quantity: 1 });
  }

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/product/${medicine.slug}`} className="relative block aspect-square bg-secondary/40">
        {medicine.images[0] ? (
          <Image
            src={medicine.images[0]}
            alt={medicine.name}
            fill
            className="object-contain p-4 transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
        {discount > 0 && (
          <Badge variant="success" className="absolute left-2 top-2">
            {discount}% OFF
          </Badge>
        )}
        {medicine.prescriptionRequired && (
          <Badge variant="warning" className="absolute right-2 top-2">
            Rx
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/product/${medicine.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">{medicine.name}</h3>
        </Link>
        {medicine.ratingsCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {medicine.ratingsAverage.toFixed(1)} ({medicine.ratingsCount})
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-semibold">{formatCurrency(medicine.sellingPrice)}</span>
          {medicine.mrp > medicine.sellingPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(medicine.mrp)}</span>
          )}
        </div>
        <Button size="sm" className="mt-2" onClick={handleAdd} disabled={addToCart.isPending}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </Card>
  );
}
