'use client';

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useMyReturns } from '@/hooks/use-returns';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  requested: 'secondary',
  approved: 'warning',
  refunded: 'success',
  rejected: 'destructive',
};

export default function ReturnsPage() {
  const { data: returns, isLoading } = useMyReturns();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Returns</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : returns && returns.length > 0 ? (
        <div className="space-y-3">
          {returns.map((r) => {
            const order = typeof r.orderId === 'object' ? r.orderId : null;
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          {order ? (
                            <Link href={`/orders/${order.id}`} className="hover:underline">
                              Order #{order.orderNumber}
                            </Link>
                          ) : (
                            'Order'
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[r.status] ?? 'secondary'}>{r.status}</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    {r.items.map((item) => (
                      <div key={item.medicineId} className="flex justify-between text-muted-foreground">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatCurrency(item.sellingPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-sm">
                    <span className="text-muted-foreground">Refund amount</span>
                    <span className="font-semibold">{formatCurrency(r.refundAmount)}</span>
                  </div>
                  {r.status === 'rejected' && r.rejectionReason && (
                    <p className="mt-2 text-xs text-destructive">Reason: {r.rejectionReason}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No return requests yet. You can request a return from a delivered order&apos;s page.
        </p>
      )}
    </div>
  );
}
