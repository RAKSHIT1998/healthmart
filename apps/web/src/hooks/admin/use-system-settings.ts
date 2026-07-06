'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/admin-api';

export function useOtpBypass() {
  return useQuery({
    queryKey: ['otp-bypass'],
    queryFn: () => api.get<{ enabled: boolean }>('/admin/settings/otp-bypass'),
  });
}

export function useSetOtpBypass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => api.patch<{ enabled: boolean }>('/admin/settings/otp-bypass', { enabled }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['otp-bypass'] });
      toast.success(data.enabled ? 'OTP bypass enabled' : 'OTP bypass disabled');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
