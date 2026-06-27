'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';

export interface DriverLocation {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface DriverAssignedInfo {
  name: string;
  phone?: string;
  vehicleNumber?: string;
}

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');

/** Subscribes to live driver-location and status-change push events for a single order. */
export function useOrderTracking(orderId: string | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverAssignedInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!orderId || !accessToken) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('order:subscribe', orderId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('driver:location', (payload: DriverLocation & { orderId: string }) => {
      if (payload.orderId === orderId) setDriverLocation(payload);
    });
    socket.on('order:status', (payload: { orderId: string; status: string }) => {
      if (payload.orderId === orderId) setLiveStatus(payload.status);
    });
    socket.on('order:driver-assigned', (payload: { orderId: string; driver: DriverAssignedInfo }) => {
      if (payload.orderId === orderId) setDriverInfo(payload.driver);
    });

    return () => {
      socket.emit('order:unsubscribe', orderId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, accessToken]);

  return { driverLocation, liveStatus, driverInfo, connected };
}
