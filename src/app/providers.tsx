'use client';

import { type PropsWithChildren, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TonConnectUIProvider, useTonWallet } from '@tonconnect/ui-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import {
  initData,
  miniApp,
  useLaunchParams,
  useSignal,
  swipeBehavior,
} from '@tma.js/sdk-react';

import { useAuthStore } from '@/stores/useAuthStore';
import { useDidMount } from '@/hooks/useDidMount';
import type { Role } from '@/lib/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});

function AuthInit({ role }: { role: Role }) {
  const initDataRaw = useSignal(initData.raw);
  const setAuth = useAuthStore((s) => s.setAuth);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initDataRaw || initialized.current) return;
    initialized.current = true;

    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: initDataRaw, role }),
    })
      .then((r) => r.json())
      .then(({ token, user }) => {
        if (token && user) setAuth(user, token, role);
      })
      .catch(console.error);
  }, [initDataRaw, role, setAuth]);

  return null;
}

function WalletSync() {
  const wallet = useTonWallet();
  const setWalletAddress = useAuthStore((s) => s.setWalletAddress);

  useEffect(() => {
    const address = wallet?.account?.address ?? null;
    setWalletAddress(address);
  }, [wallet, setWalletAddress]);

  return null;
}

function AppRootInner({ children, role }: PropsWithChildren<{ role: Role }>) {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  useEffect(() => {
    try {
      swipeBehavior.disableVertical();
    } catch {
      // not available in all environments
    }
  }, []);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <AuthInit role={role} />
      <WalletSync />
      {children}
    </AppRoot>
  );
}

interface ProvidersProps extends PropsWithChildren {
  role: Role;
}

export function Providers({ children, role }: ProvidersProps) {
  const didMount = useDidMount();

  return (
    <QueryClientProvider client={queryClient}>
      <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
        {didMount ? (
          <AppRootInner role={role}>{children}</AppRootInner>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            Loading...
          </div>
        )}
      </TonConnectUIProvider>
    </QueryClientProvider>
  );
}
