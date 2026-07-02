'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/store/auth-store';

interface VerifyOtpResponse {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string };
  isNewUser: boolean;
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (identifier: { phone: string } | { email: string }) =>
      api.post('/auth/otp/request', { ...identifier, purpose: 'login' }, { auth: false }),
    onSuccess: (_data, identifier) =>
      toast.success('phone' in identifier ? 'OTP sent to your phone' : 'OTP sent to your email'),
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

interface VerifyOtpInput {
  phone?: string;
  email?: string;
  otp: string;
  name?: string;
}

export function useVerifyOtp() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: VerifyOtpInput) => api.post<VerifyOtpResponse>('/auth/otp/verify', input, { auth: false }),
    onSuccess: (data) => {
      setSession({ accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user });
      toast.success(`Welcome${data.user.name ? `, ${data.user.name}` : ''}!`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  return useMutation({
    mutationFn: () => api.post('/auth/logout', { refreshToken }, { auth: false }),
    onSuccess: () => {
      clearSession();
      toast.success('Logged out');
    },
  });
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}
