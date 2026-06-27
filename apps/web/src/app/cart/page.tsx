'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useApplyCoupon, useCart, useRemoveCartItem, useRemoveCoupon, useUpdateCartItem } from '@/hooks/use-cart';
import { useAuthStore } from '@/store/auth-store';

export default function CartPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const [couponCode, setCouponCode] = useState('');

  if (!accessToken) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">Please log in to view your cart</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Loading your cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => (
            <Card key={`${item.medicineId}-${item.variantLabel ?? ''}`}>
              <CardContent className="flex gap-4 p-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary/40">
                  {item.image && <Image src={item.image} alt={item.name} fill className="object-contain p-2" />}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/product/${item.slug}`} className="text-sm font-medium hover:text-primary">
                        {item.name}
                      </Link>
                      {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                      {item.prescriptionRequired && (
                        <Badge variant="warning" className="mt-1">
                          Rx Required
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem.mutate({ medicineId: item.medicineId, variantLabel: item.variantLabel })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-border/60">
                      <button
                        className="p-1.5"
                        onClick={() =>
                          updateItem.mutate({ medicineId: item.medicineId, quantity: item.quantity - 1, variantLabel: item.variantLabel })
                        }
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        className="p-1.5"
                        onClick={() =>
                          updateItem.mutate({ medicineId: item.medicineId, quantity: item.quantity + 1, variantLabel: item.variantLabel })
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="font-semibold">Order Summary</h2>

              {cart.couponCode ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> {cart.couponCode} applied
                  </span>
                  <button onClick={() => removeCoupon.mutate()} className="font-medium underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                  <Button
                    variant="outline"
                    disabled={!couponCode || applyCoupon.isPending}
                    onClick={() => applyCoupon.mutate(couponCode)}
                  >
                    Apply
                  </Button>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{cart.deliveryFee === 0 ? 'FREE' : formatCurrency(cart.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Includes GST</span>
                  <span>{formatCurrency(cart.gstAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(cart.totalAmount)}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => router.push('/checkout')}>
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
