'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, MapPin, Plus, UploadCloud, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth-store';
import { useCart } from '@/hooks/use-cart';
import { useAddresses, useCreateAddress } from '@/hooks/use-addresses';
import { useCheckout } from '@/hooks/use-orders';
import { launchCashfreeCheckout } from '@/lib/cashfree';
import { api, ApiClientError, publicApiFetch } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import type { Prescription } from '@/types';
import { REGEX, type ServiceabilityCheckResult } from '@healthmart/shared';

interface UploadResult {
  url: string;
  publicId: string;
}

const PRESCRIPTION_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  approved: 'success',
  rejected: 'destructive',
  pending: 'secondary',
  ocr_processed: 'warning',
  under_review: 'warning',
};

function formatEta(minutes: number): string {
  return minutes < 60 ? `~${minutes} mins` : `~${(minutes / 60).toFixed(1)} hrs`;
}

const LocationPickerMap = dynamic(
  () => import('@/components/location/location-picker-map').then((m) => m.LocationPickerMap),
  { ssr: false },
);

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

const SLOTS = [
  { type: 'standard' as const, label: 'Standard Delivery', detail: 'Within 2-4 hours' },
  { type: 'express' as const, label: 'Express Delivery', detail: 'Within 60 minutes (+₹20)' },
  { type: 'scheduled' as const, label: 'Schedule for Later', detail: 'Pick a convenient time' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
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
  const [coords, setCoords] = useState(DEFAULT_CENTER);
  const [selectedPrescriptionIds, setSelectedPrescriptionIds] = useState<string[]>([]);
  const [newPrescriptionFiles, setNewPrescriptionFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPrescriptionItems = !!cart?.items.some((i) => i.prescriptionRequired);

  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => api.get<Prescription[]>('/prescriptions/mine?page=1&limit=20'),
    enabled: hasPrescriptionItems,
  });

  const uploadPrescription = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      newPrescriptionFiles.forEach((file) => formData.append('files', file));

      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1'}/uploads/multiple?folder=prescriptions`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: formData },
      );
      const uploadJson = await uploadResponse.json();
      if (!uploadResponse.ok) throw new ApiClientError(uploadJson.message, uploadResponse.status);

      const imageUrls = (uploadJson.data as UploadResult[]).map((r) => r.url);
      return api.post<Prescription>('/prescriptions', { imageUrls });
    },
    onSuccess: (prescription) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      setSelectedPrescriptionIds((prev) => [...prev, prescription.id]);
      setNewPrescriptionFiles([]);
      toast.success('Prescription uploaded and attached to this order.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });

  function togglePrescription(id: string) {
    setSelectedPrescriptionIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  useEffect(() => {
    if (!selectedAddressId && addresses && addresses.length > 0) {
      setSelectedAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);
  const { data: serviceability } = useQuery({
    queryKey: ['serviceability', selectedAddress?.pincode],
    queryFn: () => publicApiFetch<ServiceabilityCheckResult>(`/serviceability/check/${selectedAddress!.pincode}`),
    enabled: !!selectedAddress?.pincode,
  });
  const isBlockedByServiceability = !!selectedAddress && serviceability?.serviceable === false;

  useEffect(() => {
    if (hasHydrated && !accessToken) router.push('/login');
  }, [hasHydrated, accessToken, router]);

  if (!hasHydrated || !accessToken) return null;

  function handleAddAddress() {
    if (!REGEX.PHONE.test(form.contactPhone) || !form.line1 || !form.city || !form.pincode) return;

    createAddress.mutate(
      { ...form, label: 'home', isDefault: !addresses || addresses.length === 0, lat: coords.lat, lng: coords.lng },
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
    if (hasPrescriptionItems && selectedPrescriptionIds.length === 0) {
      toast.error('Please select or upload a prescription before placing this order.');
      return;
    }

    const result = await checkout.mutateAsync({
      addressId: selectedAddressId,
      deliverySlot: { type: slotType },
      paymentMethod,
      prescriptionIds: selectedPrescriptionIds,
    });

    if (result.requiresPayment && result.paymentSessionId) {
      await launchCashfreeCheckout(result.paymentSessionId);
    } else {
      router.push(`/orders/${result.order.id}`);
    }
  }

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
              {serviceability && (
                <p
                  className={cn(
                    'mt-3 flex items-center gap-1.5 text-sm font-medium',
                    serviceability.serviceable ? 'text-emerald-600' : 'text-destructive',
                  )}
                >
                  {serviceability.serviceable ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Delivering here in {formatEta(serviceability.estimatedDeliveryMinutes ?? 60)}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" /> Sorry, we don&apos;t deliver to this pincode yet — try a different address.
                    </>
                  )}
                </p>
              )}
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
              <CardContent className="space-y-3 p-5 text-sm">
                <p>
                  Your cart contains prescription-only medicines. Select an uploaded prescription below, or upload a
                  new one — our pharmacist will verify it.
                </p>

                {prescriptions && prescriptions.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {prescriptions.map((prescription) => (
                      <button
                        key={prescription.id}
                        type="button"
                        onClick={() => togglePrescription(prescription.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border p-2 text-left',
                          selectedPrescriptionIds.includes(prescription.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border/60 bg-background',
                        )}
                      >
                        {prescription.imageUrls[0] && (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border">
                            <Image src={prescription.imageUrls[0]} alt="Prescription" fill className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                          <Badge variant={PRESCRIPTION_STATUS_VARIANT[prescription.status] ?? 'secondary'} className="mt-0.5">
                            {prescription.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => setNewPrescriptionFiles(Array.from(e.target.files ?? []))}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className="h-3.5 w-3.5" />
                    {newPrescriptionFiles.length > 0 ? `${newPrescriptionFiles.length} file(s) selected` : 'Choose photo'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={newPrescriptionFiles.length === 0 || uploadPrescription.isPending}
                    onClick={() => uploadPrescription.mutate()}
                  >
                    Upload
                  </Button>
                </div>
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
              disabled={
                !selectedAddressId ||
                checkout.isPending ||
                isBlockedByServiceability ||
                (hasPrescriptionItems && selectedPrescriptionIds.length === 0)
              }
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
            <div>
              <Label>Delivery Location</Label>
              <LocationPickerMap lat={coords.lat} lng={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} />
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
