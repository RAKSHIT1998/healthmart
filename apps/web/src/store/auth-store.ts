'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
  loyaltyPoints: number;
  notificationPreferences?: { sms: boolean; email: boolean; push: boolean; whatsapp: boolean };
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setSession: (data: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'buymedicines-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
