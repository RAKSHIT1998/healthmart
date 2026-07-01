'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Banknote, CalendarRange, Package, ShoppingBag, TimerOff, Users, Wallet } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Role } from '@buymedicines/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/admin-api';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/admin-auth-store';
import { NAV_ITEMS } from '@/components/admin/sidebar';
import type { DashboardMetrics, SalesTrendPoint } from '@/types/admin';

const WIDGETS: Array<{
  key: keyof DashboardMetrics;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format: 'currency' | 'number';
  tint: string;
}> = [
  { key: 'todaySales', label: "Today's Sales", icon: Banknote, format: 'currency', tint: 'text-emerald-500 bg-emerald-500/10' },
  { key: 'todayOrders', label: "Today's Orders", icon: ShoppingBag, format: 'number', tint: 'text-blue-500 bg-blue-500/10' },
  { key: 'monthlySales', label: 'Monthly Sales', icon: CalendarRange, format: 'currency', tint: 'text-violet-500 bg-violet-500/10' },
  { key: 'monthlyOrders', label: 'Monthly Orders', icon: ShoppingBag, format: 'number', tint: 'text-indigo-500 bg-indigo-500/10' },
  { key: 'totalCustomers', label: 'Total Customers', icon: Users, format: 'number', tint: 'text-cyan-500 bg-cyan-500/10' },
  { key: 'cancelledOrdersToday', label: 'Cancelled Today', icon: TimerOff, format: 'number', tint: 'text-rose-500 bg-rose-500/10' },
  { key: 'averageOrderValue', label: 'Avg. Order Value', icon: Wallet, format: 'currency', tint: 'text-amber-500 bg-amber-500/10' },
  { key: 'inventoryValue', label: 'Inventory Value', icon: Package, format: 'currency', tint: 'text-teal-500 bg-teal-500/10' },
];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-primary">{formatCurrency(payload[0]!.value)}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const canViewAnalytics = role === Role.ADMIN || role === Role.MANAGER;

  useEffect(() => {
    if (role && !canViewAnalytics) {
      const landing = NAV_ITEMS.find((item) => item.roles.includes(role))?.href;
      if (landing) router.replace(landing);
    }
  }, [role, canViewAnalytics, router]);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get<DashboardMetrics>('/analytics/dashboard'),
    enabled: canViewAnalytics,
  });
  const { data: trend } = useQuery({
    queryKey: ['sales-trend'],
    queryFn: () => api.get<SalesTrendPoint[]>('/analytics/sales-trend?days=30'),
    enabled: canViewAnalytics,
  });

  if (role && !canViewAnalytics) return null;

  return (
    <div className="ambient-glow -m-6 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">A snapshot of how the store is doing right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {WIDGETS.map((widget, index) => {
          const Icon = widget.icon;
          const value = metrics?.[widget.key] ?? 0;
          return (
            <motion.div
              key={widget.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
            >
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{widget.label}</span>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', widget.tint)}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight">
                    {isLoading ? '···' : widget.format === 'currency' ? formatCurrency(value) : value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
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
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(d: string) => d.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={50} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
