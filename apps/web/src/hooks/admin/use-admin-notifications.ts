'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/admin-auth-store';
import { formatCurrency } from '@/lib/utils';

interface NewOrderAlert {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  branchId?: string;
  timestamp: string;
}

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');

/** Live-alerts staff the moment a new order is placed, so it can be picked up for preparation immediately. */
export function useAdminNotifications(onNewOrder?: (order: NewOrderAlert) => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('order:new', (payload: NewOrderAlert) => {
      toast.success(`New order ${payload.orderNumber}`, {
        description: `${formatCurrency(payload.totalAmount)} — ready for preparation`,
      });
      onNewOrder?.(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
}
