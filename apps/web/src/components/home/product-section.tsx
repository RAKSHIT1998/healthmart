import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { publicApiFetch } from '@/lib/api';
import { ProductCard } from '@/components/product/product-card';
import type { Medicine } from '@/types';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  query: string;
  viewAllHref?: string;
}

export async function ProductSection({ title, subtitle, query, viewAllHref }: ProductSectionProps) {
  let items: Medicine[] = [];
  try {
    items = await publicApiFetch<Medicine[]>(`/medicines?${query}`);
  } catch {
    items = [];
  }

  if (items.length === 0) return null;

  return (
    <section className="container py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((medicine) => (
          <ProductCard key={medicine.id} medicine={medicine} />
        ))}
      </div>
    </section>
  );
}
