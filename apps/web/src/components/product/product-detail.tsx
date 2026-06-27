'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from './product-card';
import { ReviewSection } from './review-section';
import { formatCurrency } from '@/lib/utils';
import { useAddToCart } from '@/hooks/use-cart';
import { useAuthStore } from '@/store/auth-store';
import type { MedicineDetailResponse } from '@/types';

export function ProductDetail({ data }: { data: MedicineDetailResponse }) {
  const { medicine, related, rating, availability } = data;
  const [activeImage, setActiveImage] = useState(0);
  const [variantLabel, setVariantLabel] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();

  const activeVariant = medicine.variants.find((v) => v.label === variantLabel);
  const sellingPrice = activeVariant?.sellingPrice ?? medicine.sellingPrice;
  const mrp = activeVariant?.mrp ?? medicine.mrp;
  const discount = mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const inStock = availability.availableQuantity > 0;
  const manufacturerName = typeof medicine.manufacturerId === 'object' ? medicine.manufacturerId.name : undefined;

  function handleAddToCart() {
    if (!accessToken) {
      router.push('/login');
      return;
    }
    addToCart.mutate({ medicineId: medicine.id, quantity, variantLabel });
  }

  function handleBuyNow() {
    if (!accessToken) {
      router.push('/login');
      return;
    }
    addToCart.mutate(
      { medicineId: medicine.id, quantity, variantLabel },
      { onSuccess: () => router.push('/cart') },
    );
  }

  return (
    <div className="container py-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-secondary/30">
            {medicine.images[activeImage] && (
              <Image src={medicine.images[activeImage]} alt={medicine.name} fill className="object-contain p-8" />
            )}
          </div>
          {medicine.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {medicine.images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(index)}
                  className={`relative h-16 w-16 overflow-hidden rounded-lg border ${activeImage === index ? 'border-primary' : 'border-border/60'}`}
                >
                  <Image src={image} alt="" fill className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {manufacturerName && <p className="text-sm text-muted-foreground">by {manufacturerName}</p>}
          <h1 className="mt-1 text-2xl font-bold">{medicine.name}</h1>

          <div className="mt-2 flex items-center gap-3">
            {medicine.ratingsCount > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {medicine.ratingsAverage.toFixed(1)}
                <span className="text-muted-foreground">({medicine.ratingsCount} reviews)</span>
              </div>
            )}
            {medicine.prescriptionRequired && <Badge variant="warning">Prescription Required</Badge>}
            <Badge variant={inStock ? 'success' : 'destructive'}>{inStock ? 'In Stock' : 'Out of Stock'}</Badge>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatCurrency(sellingPrice)}</span>
            {mrp > sellingPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatCurrency(mrp)}</span>
                <Badge variant="success">{discount}% OFF</Badge>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Inclusive of all taxes (GST {medicine.gstPercentage}%)</p>

          {medicine.variants.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Pack size</p>
              <div className="flex flex-wrap gap-2">
                {medicine.variants.map((variant) => (
                  <button
                    key={variant.label}
                    onClick={() => setVariantLabel(variant.label === variantLabel ? undefined : variant.label)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${variantLabel === variant.label ? 'border-primary bg-primary/10 text-primary' : 'border-border/60'}`}
                  >
                    {variant.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-border/60">
              <button className="p-2" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <button className="p-2" onClick={() => setQuantity((q) => Math.min(50, q + 1))}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button size="lg" className="flex-1" disabled={!inStock || addToCart.isPending} onClick={handleAddToCart}>
              Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="flex-1" disabled={!inStock} onClick={handleBuyNow}>
              Buy Now
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-2 rounded-xl bg-secondary/50 p-4 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Same-day delivery available
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> 100% genuine, sourced from licensed distributors
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="flex-wrap">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="composition">Composition</TabsTrigger>
            <TabsTrigger value="uses">Uses</TabsTrigger>
            <TabsTrigger value="dosage">Dosage</TabsTrigger>
            <TabsTrigger value="side-effects">Side Effects</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="text-sm leading-relaxed text-muted-foreground">
            {medicine.description}
          </TabsContent>
          <TabsContent value="composition">
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {medicine.composition.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="uses">
            {medicine.uses.length > 0 ? (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {medicine.uses.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No usage information available.</p>
            )}
          </TabsContent>
          <TabsContent value="dosage" className="text-sm leading-relaxed text-muted-foreground">
            {medicine.dosage || 'Please consult your doctor or pharmacist for dosage information.'}
          </TabsContent>
          <TabsContent value="side-effects">
            {medicine.sideEffects.length > 0 ? (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {medicine.sideEffects.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No known side effects listed.</p>
            )}
          </TabsContent>
          <TabsContent value="storage" className="text-sm leading-relaxed text-muted-foreground">
            {medicine.storageInstructions || 'Store in a cool, dry place away from direct sunlight.'}
          </TabsContent>
        </Tabs>
      </div>

      {Array.isArray(medicine.alternativeMedicineIds) && medicine.alternativeMedicineIds.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Alternatives</h2>
          <p className="text-sm text-muted-foreground">
            Consult your pharmacist before switching to an alternative brand.
          </p>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Related Medicines</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {related.map((m) => (
              <ProductCard key={m.id} medicine={m} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        <ReviewSection medicineId={medicine.id} />
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Have questions about this medicine? <Link href="/contact" className="text-primary hover:underline">Contact our pharmacist</Link>
      </p>
    </div>
  );
}
