'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '@healthmart/shared';

export interface StaffUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  branchId?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: StaffUser | null;
  hasHydrated: boolean;
  setSession: (data: { accessToken: string; refreshToken: string; user: StaffUser }) => void;
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
      name: 'healthmart-dashboard-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
