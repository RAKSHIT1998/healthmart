import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ShopClient } from './shop-client';

export const metadata: Metadata = {
  title: 'Shop Medicines & Healthcare Products',
  description: 'Browse prescription medicines, OTC drugs, healthcare devices, baby care and personal care products with fast delivery.',
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center text-muted-foreground">Loading...</div>}>
      <ShopClient />
    </Suspense>
  );
}
