'use client';

import { create } from 'zustand';

interface UIState {
  activeTab: string;
  isLoading: boolean;
}

interface UIActions {
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState: UIState = {
  activeTab: '',
  isLoading: false,
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialState,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set(initialState),
}));
