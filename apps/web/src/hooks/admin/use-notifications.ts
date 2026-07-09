'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/admin-api';
import type { AdminNotification } from '@/types/admin';

interface AdminNotificationsResult {
  items: AdminNotification[];
  unreadCount: number;
}

interface NotificationsMeta {
  unreadCount?: number;
}

export function useAdminNotificationFeed(limit = 8) {
  return useQuery({
    queryKey: ['admin-notifications', limit],
    queryFn: async (): Promise<AdminNotificationsResult> => {
      const result = await apiFetchWithMeta<AdminNotification>(`/notifications?page=1&limit=${limit}`);
      const meta = result.meta as NotificationsMeta;
      return {
        items: result.items,
        unreadCount: typeof meta.unreadCount === 'number' ? meta.unreadCount : 0,
      };
    },
  });
}

export function useMarkAdminNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.patch<AdminNotification>(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useMarkAllAdminNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.patch<null>('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
