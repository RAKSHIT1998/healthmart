'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/store/auth-store';

interface AuthResponse {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string };
}

export interface CustomerSignupInput {
  name: string;
  phone?: string;
  email?: string;
  password: string;
}

export interface CustomerLoginInput {
  phone?: string;
  email?: string;
  password: string;
}

function useSessionSetter() {
  return useAuthStore((s) => s.setSession);
}

export function useCustomerSignup() {
  const setSession = useSessionSetter();

  return useMutation({
    mutationFn: (input: CustomerSignupInput) => api.post<AuthResponse>('/auth/signup', input, { auth: false }),
    onSuccess: (data) => {
      setSession({ accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user });
      toast.success(`Welcome${data.user.name ? `, ${data.user.name}` : ''}!`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useCustomerLogin() {
  const setSession = useSessionSetter();

  return useMutation({
    mutationFn: (input: CustomerLoginInput) => api.post<AuthResponse>('/auth/login', input, { auth: false }),
    onSuccess: (data) => {
      setSession({ accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user });
      toast.success(`Welcome back${data.user.name ? `, ${data.user.name}` : ''}!`);
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
