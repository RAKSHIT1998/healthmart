'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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

function playNewOrderChime() {
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    [880, 1108.73].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });

    setTimeout(() => ctx.close(), 700);
  } catch {
    // Audio can be blocked by the browser; the toast and unread badge still update.
  }
}

export function useAdminNotifications(onNewOrder?: (order: NewOrderAlert) => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('order:new', (payload: NewOrderAlert) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      playNewOrderChime();
      toast.success(`New order ${payload.orderNumber}`, {
        description: `${formatCurrency(payload.totalAmount)} is ready for preparation`,
      });
      onNewOrder?.(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, onNewOrder, queryClient]);
}
