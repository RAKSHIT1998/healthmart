'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth-store';
import { useCart } from '@/hooks/use-cart';
import { useAddresses, useCreateAddress } from '@/hooks/use-addresses';
import { useCheckout } from '@/hooks/use-orders';
import { launchCashfreeCheckout } from '@/lib/cashfree';
import { formatCurrency, cn } from '@/lib/utils';
import { REGEX } from '@healthmart/shared';

const SLOTS = [
  { type: 'standard' as const, label: 'Standard Delivery', detail: 'Within 2-4 hours' },
  { type: 'express' as const, label: 'Express Delivery', detail: 'Within 60 minutes (+₹20)' },
  { type: 'scheduled' as const, label: 'Schedule for Later', detail: 'Pick a convenient time' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: cart } = useCart();
  const { data: addresses } = useAddresses();
  const createAddress = useCreateAddress();
  const checkout = useCheckout();

  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();
  const [slotType, setSlotType] = useState<'standard' | 'express' | 'scheduled'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cashfree' | 'cod' | 'wallet'>('cashfree');
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!selectedAddressId && addresses && addresses.length > 0) {
      setSelectedAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!accessToken) router.push('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  function handleAddAddress() {
    if (!REGEX.PHONE.test(form.contactPhone) || !form.line1 || !form.city || !form.pincode) return;

    navigator.geolocation?.getCurrentPosition(
      (position) => submitAddress(position.coords.latitude, position.coords.longitude),
      () => submitAddress(0, 0),
      { timeout: 4000 },
    );
  }

  function submitAddress(lat: number, lng: number) {
    createAddress.mutate(
      { ...form, label: 'home', isDefault: !addresses || addresses.length === 0, lat, lng },
      {
        onSuccess: (address) => {
          setSelectedAddressId(address.id);
          setShowAddressDialog(false);
        },
      },
    );
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId || !cart) return;
    const prescriptionIds: string[] = [];

    const result = await checkout.mutateAsync({
      addressId: selectedAddressId,
      deliverySlot: { type: slotType },
      paymentMethod,
      prescriptionIds,
    });

    if (result.requiresPayment && result.paymentSessionId) {
      await launchCashfreeCheckout(result.paymentSessionId);
    } else {
      router.push(`/orders/${result.order.id}`);
    }
  }

  const hasPrescriptionItems = cart?.items.some((i) => i.prescriptionRequired);

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Delivery Address</h2>
                <Button variant="outline" size="sm" onClick={() => setShowAddressDialog(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add New
                </Button>
              </div>
              <div className="space-y-2">
                {addresses?.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left',
                      selectedAddressId === address.id ? 'border-primary bg-primary/5' : 'border-border/60',
                    )}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {address.contactName} <span className="text-muted-foreground">· {address.contactPhone}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {address.line1}, {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                  </button>
                ))}
                {(!addresses || addresses.length === 0) && (
                  <p className="text-sm text-muted-foreground">No saved addresses. Add one to continue.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 font-semibold">Delivery Slot</h2>
              <div className="space-y-2">
                {SLOTS.map((slot) => (
                  <button
                    key={slot.type}
                    onClick={() => setSlotType(slot.type)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm',
                      slotType === slot.type ? 'border-primary bg-primary/5' : 'border-border/60',
                    )}
                  >
                    <span className="font-medium">{slot.label}</span>
                    <span className="text-muted-foreground">{slot.detail}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {hasPrescriptionItems && (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="p-5 text-sm">
                Your cart contains prescription-only medicines. Please{' '}
                <a href="/prescription-upload" className="font-medium text-primary underline">
                  upload your prescription
                </a>{' '}
                before placing this order — our pharmacist will verify it.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 font-semibold">Payment Method</h2>
              <div className="space-y-2">
                {[
                  { value: 'cashfree' as const, label: 'Pay Online (UPI / Card / Netbanking)' },
                  { value: 'cod' as const, label: 'Cash on Delivery' },
                  { value: 'wallet' as const, label: 'Wallet Balance' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPaymentMethod(option.value)}
                    className={cn(
                      'flex w-full items-center rounded-lg border p-3 text-left text-sm font-medium',
                      paymentMethod === option.value ? 'border-primary bg-primary/5' : 'border-border/60',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold">Order Summary</h2>
            {cart && (
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
                <div className="flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(cart.totalAmount)}</span>
                </div>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={!selectedAddressId || checkout.isPending}
              onClick={handlePlaceOrder}
            >
              Place Order
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Delivery Address</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} maxLength={10} />
            </div>
            <div>
              <Label>Address Line</Label>
              <Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} maxLength={6} />
            </div>
            <Button onClick={handleAddAddress} disabled={createAddress.isPending}>
              Save Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
