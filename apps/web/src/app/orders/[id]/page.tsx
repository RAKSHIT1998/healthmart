'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Check, Clock, Package, Phone, Truck, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useCancelOrder, useOrder } from '@/hooks/use-orders';
import { useOrderTracking } from '@/hooks/use-order-tracking';

const LiveMap = dynamic(() => import('@/components/order/live-map').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="flex h-72 items-center justify-center rounded-xl border text-sm text-muted-foreground">Loading map...</div>,
});

const STAGES = [
  { status: 'placed', label: 'Placed', icon: Check },
  { status: 'accepted', label: 'Accepted', icon: Check },
  { status: 'packed', label: 'Packed', icon: Package },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Check },
];

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(params.id);
  const cancelOrder = useCancelOrder();
  const [reason] = useState('Changed my mind');
  const { driverLocation, liveStatus, driverInfo, connected } = useOrderTracking(order?.id);

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Loading order...</div>;
  if (!order) return <div className="container py-20 text-center text-muted-foreground">Order not found</div>;

  const effectiveStatus = liveStatus ?? order.status;
  const isCancelled = effectiveStatus === 'cancelled' || effectiveStatus === 'rejected';
  const currentStageIndex = STAGES.findIndex((s) => s.status === effectiveStatus);
  const canCancel = ['pending_payment', 'placed', 'accepted'].includes(effectiveStatus);
  const isOutForDelivery = effectiveStatus === 'out_for_delivery';

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={isCancelled ? 'destructive' : 'success'}>{effectiveStatus.replace(/_/g, ' ')}</Badge>
      </div>

      {isCancelled ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 p-5 text-destructive">
            <XCircle className="h-5 w-5" />
            <p className="text-sm">This order was {effectiveStatus}.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              {STAGES.map((stage, index) => {
                const Icon = stage.icon;
                const reached = index <= currentStageIndex;
                return (
                  <div key={stage.status} className="flex flex-1 flex-col items-center text-center">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2',
                        reached ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="mt-2 text-[11px] font-medium">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isOutForDelivery && (
        <Card className="mt-6">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Live Tracking</h2>
              <span className={cn('flex items-center gap-1 text-xs', connected ? 'text-emerald-600' : 'text-muted-foreground')}>
                <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                {connected ? 'Live' : 'Connecting...'}
              </span>
            </div>

            <LiveMap
              driver={driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null}
              destination={{ lat: order.addressSnapshot.lat, lng: order.addressSnapshot.lng }}
            />

            {driverInfo && (
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 text-sm">
                <div>
                  <p className="font-medium">{driverInfo.name}</p>
                  <p className="text-xs text-muted-foreground">{driverInfo.vehicleNumber}</p>
                </div>
                {driverInfo.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${driverInfo.phone}`}>
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  </Button>
                )}
              </div>
            )}

            {order.estimatedDeliveryAt && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Estimated arrival {new Date(order.estimatedDeliveryAt).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">Items</h2>
          {order.items.map((item) => (
            <div key={`${item.medicineId}-${item.variantLabel ?? ''}`} className="flex justify-between text-sm">
              <span>
                {item.name} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
              </span>
              <span>{formatCurrency(item.sellingPrice * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-border/60 pt-2 text-right text-base font-semibold">
            {formatCurrency(order.totalAmount)}
          </div>
        </CardContent>
      </Card>

      {(order.proofOfDeliveryUrl || order.customerSignatureUrl) && (
        <Card className="mt-6">
          <CardContent className="p-5">
            <h2 className="mb-3 font-semibold">Proof of Delivery</h2>
            <div className="flex gap-4">
              {order.proofOfDeliveryUrl && (
                <a href={order.proofOfDeliveryUrl} target="_blank" rel="noreferrer" className="relative h-28 w-28 overflow-hidden rounded-lg border">
                  <Image src={order.proofOfDeliveryUrl} alt="Delivery proof" fill className="object-cover" />
                </a>
              )}
              {order.customerSignatureUrl && (
                <a href={order.customerSignatureUrl} target="_blank" rel="noreferrer" className="relative h-28 w-28 overflow-hidden rounded-lg border bg-white">
                  <Image src={order.customerSignatureUrl} alt="Signature" fill className="object-contain" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" asChild>
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/invoice`} target="_blank" rel="noreferrer">
            View Invoice
          </a>
        </Button>
        {canCancel && (
          <Button
            variant="destructive"
            onClick={() => cancelOrder.mutate({ orderId: order.id, reason })}
            disabled={cancelOrder.isPending}
          >
            Cancel Order
          </Button>
        )}
      </div>
    </div>
  );
}
