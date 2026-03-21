"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  initData,
  miniApp,
  swipeBehavior,
  useLaunchParams,
  useSignal,
} from "@tma.js/sdk-react";
import { TonConnectUIProvider, useTonWallet } from "@tonconnect/ui-react";
import { type PropsWithChildren, useEffect, useRef } from "react";

import { useDidMount } from "@/hooks/useDidMount";
import type { Role } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";

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

    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

function AppInner({ children, role }: PropsWithChildren<{ role: Role }>) {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    try {
      swipeBehavior.disableVertical();
    } catch {
      // not available in all environments
    }
  }, []);

  // lp is used to detect platform if needed in the future
  void lp;

  return (
    <>
      <AuthInit role={role} />
      <WalletSync />
      {children}
    </>
  );
}

interface ProvidersProps extends PropsWithChildren {
  role: Role;
}

export function Providers({ children, role }: ProvidersProps) {
  const didMount = useDidMount();

  return (
    <QueryClientProvider client={queryClient}>
      <TonConnectUIProvider
        manifestUrl={`https://hacka-ton-dun.vercel.app/tonconnect-manifest.json`}
        actionsConfiguration={{
          twaReturnUrl: `https://t.me/canette_marketplace_bot`,
        }}
      >
        {didMount ? (
          <AppInner role={role}>{children}</AppInner>
        ) : (
          <div className="flex justify-center p-10">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        )}
      </TonConnectUIProvider>
    </QueryClientProvider>
  );
}
