'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Camera, MapPin, Navigation, Phone, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignaturePad } from '@/components/delivery/signature-pad';
import { formatCurrency } from '@/lib/utils';

const DestinationMap = dynamic(() => import('@/components/delivery/destination-map').then((m) => m.DestinationMap), {
  ssr: false,
  loading: () => <div className="h-36 w-full animate-pulse rounded-lg bg-secondary" />,
});

function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}
import { uploadFile, dataUrlToBlob } from '@/lib/upload';
import {
  useMyDeliveries,
  useResendDeliveryOtp,
  useToggleAvailability,
  useUpdateMyLocation,
  useVerifyDeliveryOtp,
} from '@/hooks/use-deliveries';
import type { AdminOrder } from '@/types';

const LOCATION_THROTTLE_MS = 15_000;

export default function DeliveriesPage() {
  const { data, isLoading } = useMyDeliveries();
  const toggleAvailability = useToggleAvailability();
  const updateLocation = useUpdateMyLocation();
  const resendOtp = useResendDeliveryOtp();
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeOrder, setActiveOrder] = useState<AdminOrder | null>(null);
  const lastSentRef = useRef(0);

  const hasOutForDelivery = data?.items.some((o) => o.status === 'out_for_delivery') ?? false;

  // Continuously reports position while a delivery is in progress — this is what feeds the
  // customer's live map via the backend's Socket.IO broadcast.
  useEffect(() => {
    if (!hasOutForDelivery || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < LOCATION_THROTTLE_MS) return;
        lastSentRef.current = now;
        updateLocation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOutForDelivery]);

  function shareLocationNow() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      updateLocation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Deliveries</h1>
        <div className="flex items-center gap-4">
          {hasOutForDelivery && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Sharing live location
            </span>
          )}
          <Button variant="outline" size="sm" onClick={shareLocationNow}>
            <Navigation className="h-4 w-4" /> Share Now
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm">Available</span>
            <Switch
              checked={isAvailable}
              onCheckedChange={(v) => {
                setIsAvailable(v);
                toggleAvailability.mutate(v);
              }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders assigned to you right now.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((order) => {
            const address = order.addressSnapshot;
            return (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">#{order.orderNumber}</span>
                  <Badge variant="warning">{order.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{order.items.length} item(s) · {formatCurrency(order.totalAmount)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{order.paymentMethod === 'cod' ? 'Collect cash on delivery' : 'Paid online'}</p>

                {address && (
                  <div className="mt-3 space-y-2 rounded-lg border border-border/60 p-2.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{address.contactName}</p>
                        <p className="text-muted-foreground">
                          {address.line1}
                          {address.landmark ? `, ${address.landmark}` : ''}, {address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                    </div>
                    {address.lat && address.lng && <DestinationMap lat={address.lat} lng={address.lng} />}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <a href={googleMapsDirectionsUrl(address.lat, address.lng)} target="_blank" rel="noreferrer">
                          <Navigation className="h-3.5 w-3.5" /> Navigate
                        </a>
                      </Button>
                      {address.contactPhone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${address.contactPhone}`}>
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => setActiveOrder(order)}>
                    Mark Delivered
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => resendOtp.mutate(order.id)} title="Resend OTP">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <DeliveryConfirmDialog order={activeOrder} onClose={() => setActiveOrder(null)} />
    </div>
  );
}

function DeliveryConfirmDialog({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const verifyOtp = useVerifyDeliveryOtp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [otp, setOtp] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function reset() {
    setOtp('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setSignatureDataUrl(null);
  }

  async function handleConfirm() {
    if (!order || otp.length !== 6) return;
    setUploading(true);
    try {
      const [proofOfDeliveryUrl, customerSignatureUrl] = await Promise.all([
        photoFile ? uploadFile(photoFile, 'delivery-proof') : Promise.resolve(undefined),
        signatureDataUrl ? uploadFile(dataUrlToBlob(signatureDataUrl), 'signatures') : Promise.resolve(undefined),
      ]);

      await verifyOtp.mutateAsync({ orderId: order.id, otp, proofOfDeliveryUrl, customerSignatureUrl });
      reset();
      onClose();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Delivery {order && `— #${order.orderNumber}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Delivery OTP (from customer)</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="123456" />
          </div>

          <div>
            <Label>Proof of Delivery Photo (optional)</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Proof" className="h-full object-contain" />
              ) : (
                <span className="flex items-center gap-2 text-sm">
                  <Camera className="h-4 w-4" /> Capture photo
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPhotoFile(file);
                setPhotoPreview(URL.createObjectURL(file));
              }}
            />
          </div>

          <div>
            <Label>Customer Signature (optional)</Label>
            <SignaturePad onSave={setSignatureDataUrl} />
            {signatureDataUrl && <p className="mt-1 text-xs text-emerald-600">Signature captured ✓</p>}
          </div>

          <Button className="w-full" onClick={handleConfirm} disabled={otp.length !== 6 || uploading || verifyOtp.isPending}>
            {uploading ? 'Uploading...' : 'Confirm Delivery'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
