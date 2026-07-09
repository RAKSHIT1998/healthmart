'use client';

import Link from 'next/link';
import { Bell, CheckCheck, Package2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  useAdminNotificationFeed,
  useMarkAdminNotificationRead,
  useMarkAllAdminNotificationsRead,
} from '@/hooks/admin/use-notifications';

export function AdminNotificationCenter() {
  const [open, setOpen] = useState(false);
  const notificationsQuery = useAdminNotificationFeed();
  const markRead = useMarkAdminNotificationRead();
  const markAllRead = useMarkAllAdminNotificationsRead();

  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" title="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>New customer orders appear here for the admin team.</DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0 || markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[28rem] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {items.map((notification) => {
                const orderId = notification.data?.orderId;
                const orderNumber = notification.data?.orderNumber;
                const amount = notification.data?.totalAmount;

                return (
                  <div
                    key={notification.id}
                    className={notification.isRead ? 'bg-background' : 'bg-primary/5'}
                  >
                    <div className="flex items-start gap-3 px-6 py-4">
                      <div className="mt-1 rounded-full bg-secondary p-2 text-secondary-foreground">
                        <Package2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{notification.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                            {typeof amount === 'number' ? (
                              <p className="mt-2 text-xs font-medium text-foreground">{formatCurrency(amount)}</p>
                            ) : null}
                          </div>
                          {!notification.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                          <div className="flex items-center gap-2">
                            {!notification.isRead ? (
                              <Button variant="ghost" size="sm" onClick={() => markRead.mutate(notification.id)} disabled={markRead.isPending}>
                                Mark read
                              </Button>
                            ) : null}
                            {orderId ? (
                              <Button asChild size="sm">
                                <Link
                                  href="/admin/orders"
                                  onClick={() => {
                                    if (!notification.isRead) markRead.mutate(notification.id);
                                    setOpen(false);
                                  }}
                                >
                                  View order{orderNumber ? ` ${orderNumber}` : ''}
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
