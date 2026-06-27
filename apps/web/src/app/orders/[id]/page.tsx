'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Check, Package, Truck, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useCancelOrder, useOrder } from '@/hooks/use-orders';

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
  const [reason, setReason] = useState('Changed my mind');

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Loading order...</div>;
  if (!order) return <div className="container py-20 text-center text-muted-foreground">Order not found</div>;

  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';
  const currentStageIndex = STAGES.findIndex((s) => s.status === order.status);
  const canCancel = ['pending_payment', 'placed', 'accepted'].includes(order.status);

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={isCancelled ? 'destructive' : 'success'}>{order.status.replace(/_/g, ' ')}</Badge>
      </div>

      {isCancelled ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 p-5 text-destructive">
            <XCircle className="h-5 w-5" />
            <p className="text-sm">This order was {order.status}.</p>
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
                    {index < STAGES.length - 1 && (
                      <div className={cn('absolute h-0.5 w-full', reached && 'bg-primary')} />
                    )}
                  </div>
                );
              })}
            </div>
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
