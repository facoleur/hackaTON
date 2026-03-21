'use client';

import { create } from 'zustand';
import type { User, Role } from '@/lib/types';

interface AuthState {
  telegramUser: User | null;
  role: Role | null;
  supabaseToken: string | null;
  walletAddress: string | null;
}

interface AuthActions {
  setAuth: (user: User, token: string, role: Role) => void;
  setWalletAddress: (address: string | null) => void;
  reset: () => void;
}

const initialState: AuthState = {
  telegramUser: null,
  role: null,
  supabaseToken: null,
  walletAddress: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,
  setAuth: (user, token, role) =>
    set({ telegramUser: user, supabaseToken: token, role }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  reset: () => set(initialState),
}));
