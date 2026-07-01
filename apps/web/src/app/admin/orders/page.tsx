'use client';

import { useState } from 'react';
import { OrderStatus, ORDER_STATUS_TRANSITIONS } from '@buymedicines/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useAdminOrders, useAssignDriver, useUpdateOrderStatus } from '@/hooks/admin/use-orders';
import { useAvailableDrivers } from '@/hooks/admin/use-drivers';

const STATUS_FILTERS = ['all', ...Object.values(OrderStatus)];

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  delivered: 'success',
  cancelled: 'destructive',
  rejected: 'destructive',
  out_for_delivery: 'warning',
  packed: 'warning',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const { data, isLoading } = useAdminOrders(page, statusFilter === 'all' ? undefined : statusFilter);
  const updateStatus = useUpdateOrderStatus();
  const assignDriver = useAssignDriver();
  const assigningOrder = data?.items.find((o) => o.id === assigningOrderId);
  const { data: drivers } = useAvailableDrivers(assigningOrder?.branchId ?? '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((status) => (
              <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={7}>Loading...</td></tr>
              ) : (
                data?.items.map((order) => {
                  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
                  return (
                    <tr key={order.id} className="border-b border-border/40">
                      <td className="p-3 font-medium">{order.orderNumber}</td>
                      <td className="p-3">{typeof order.userId === 'object' ? order.userId.name : order.userId}</td>
                      <td className="p-3">{formatCurrency(order.totalAmount)}</td>
                      <td className="p-3 capitalize">{order.paymentMethod} · {order.paymentStatus}</td>
                      <td className="p-3">
                        <Badge variant={STATUS_VARIANT[order.status] ?? 'secondary'}>{order.status.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {nextStatuses.filter((s) => s !== OrderStatus.CANCELLED).map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ id: order.id, status })}
                              disabled={updateStatus.isPending}
                            >
                              {status.replace(/_/g, ' ')}
                            </Button>
                          ))}
                          {order.status === OrderStatus.PACKED && !order.driverId && (
                            <Button size="sm" variant="secondary" onClick={() => setAssigningOrderId(order.id)}>
                              Assign Driver
                            </Button>
                          )}
                        </div>
                        {assigningOrderId === order.id && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {drivers?.map((driver) => (
                              <Button
                                key={driver.id}
                                size="sm"
                                onClick={() => {
                                  assignDriver.mutate({ id: order.id, driverId: driver.id });
                                  setAssigningOrderId(null);
                                }}
                              >
                                {typeof driver.userId === 'object' ? driver.userId.name : 'Driver'}
                              </Button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {data?.meta.pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.meta.pagination.page} of {data.meta.pagination.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!data.meta.pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!data.meta.pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
