'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import { useAuthStore, type StaffUser } from '@/store/auth-store';

interface LoginResponse {
  user: StaffUser;
  tokens: { accessToken: string; refreshToken: string };
}

export function useStaffLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post<LoginResponse>('/auth/staff/login', { email, password }, { auth: false }),
    onSuccess: (data) => {
      setSession({ accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user });
      toast.success(`Welcome back, ${data.user.name}`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  return useMutation({
    mutationFn: () => api.post('/auth/logout', { refreshToken }, { auth: false }),
    onSuccess: () => clearSession(),
  });
}
