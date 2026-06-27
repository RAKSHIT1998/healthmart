'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, CalendarRange, Package, ShoppingBag, TimerOff, Users, Wallet } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { DashboardMetrics, SalesTrendPoint } from '@/types';

const WIDGETS: Array<{ key: keyof DashboardMetrics; label: string; icon: React.ComponentType<{ className?: string }>; format: 'currency' | 'number' }> = [
  { key: 'todaySales', label: "Today's Sales", icon: Banknote, format: 'currency' },
  { key: 'todayOrders', label: "Today's Orders", icon: ShoppingBag, format: 'number' },
  { key: 'monthlySales', label: 'Monthly Sales', icon: CalendarRange, format: 'currency' },
  { key: 'monthlyOrders', label: 'Monthly Orders', icon: ShoppingBag, format: 'number' },
  { key: 'totalCustomers', label: 'Total Customers', icon: Users, format: 'number' },
  { key: 'cancelledOrdersToday', label: 'Cancelled Today', icon: TimerOff, format: 'number' },
  { key: 'averageOrderValue', label: 'Avg. Order Value', icon: Wallet, format: 'currency' },
  { key: 'inventoryValue', label: 'Inventory Value', icon: Package, format: 'currency' },
];

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get<DashboardMetrics>('/analytics/dashboard'),
  });
  const { data: trend } = useQuery({
    queryKey: ['sales-trend'],
    queryFn: () => api.get<SalesTrendPoint[]>('/analytics/sales-trend?days=30'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {WIDGETS.map((widget) => {
          const Icon = widget.icon;
          const value = metrics?.[widget.key] ?? 0;
          return (
            <Card key={widget.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{widget.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-xl font-bold">
                  {isLoading ? '...' : widget.format === 'currency' ? formatCurrency(value) : value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(metrics?.lowStockCount ?? 0) > 0 || (metrics?.expiringSoonCount ?? 0) > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {metrics && metrics.lowStockCount > 0 && (
            <Card className="border-amber-300/60 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm">
                  <strong>{metrics.lowStockCount}</strong> medicine(s) are running low on stock.
                </p>
              </CardContent>
            </Card>
          )}
          {metrics && metrics.expiringSoonCount > 0 && (
            <Card className="border-rose-300/60 bg-rose-50 dark:bg-rose-900/20">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <p className="text-sm">
                  <strong>{metrics.expiringSoonCount}</strong> batch(es) are nearing expiry.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-72 p-0 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend ?? []} margin={{ left: 12, right: 24, top: 10 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} width={50} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
