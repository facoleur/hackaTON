"use client";

import { AppLoader } from "@/components/AppLoader";
import { useDidMount } from "@/hooks/useDidMount";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { Role } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  initData,
  miniApp,
  swipeBehavior,
  useLaunchParams,
  useSignal,
} from "@tma.js/sdk-react";
import { Address } from "@ton/core";
import { TonConnectUIProvider, useTonWallet } from "@tonconnect/ui-react";
import { type PropsWithChildren, useEffect, useRef } from "react";

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
  const rawAddress = wallet?.account?.address ?? null;
  const address = rawAddress
    ? Address.parse(rawAddress).toString({ urlSafe: true, bounceable: false })
    : null;
  const setWalletAddress = useAuthStore((s) => s.setWalletAddress);
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);

  // Sync address into store whenever it changes
  useEffect(() => {
    setWalletAddress(address);
  }, [address, setWalletAddress]);

  // Persist to DB — runs when address OR auth credentials become available
  useEffect(() => {
    if (!token || !userId) return;

    const supabase = getSupabaseClient(token);
    supabase
      .from("users")
      .update({ wallet_address: address })
      .eq("id", userId)
      .select()
      .then(({ data, error }) => {
        if (error)
          console.error("[WalletSync] failed to persist wallet", error);
        else if (!data || data.length === 0)
          console.error(
            "[WalletSync] wallet update matched 0 rows — check RLS policy on users table. userId:",
            userId,
          );
        else console.log("[WalletSync] wallet persisted", address);
      });
  }, [address, token, userId]);

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
        manifestUrl={process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL!}
        actionsConfiguration={{
          twaReturnUrl: (role === "client"
            ? process.env.NEXT_PUBLIC_CLIENT_TWA_URL!
            : process.env
                .NEXT_PUBLIC_THERAPIST_TWA_URL!) as `${string}://${string}`,
        }}
      >
        {didMount ? <AppInner role={role}>{children}</AppInner> : <AppLoader />}
      </TonConnectUIProvider>
    </QueryClientProvider>
  );
}
