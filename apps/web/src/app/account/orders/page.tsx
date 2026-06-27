'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useMyOrders } from '@/hooks/use-orders';

export default function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Orders</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders...</p>
      ) : !orders || orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} · {order.items.length} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                    <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
