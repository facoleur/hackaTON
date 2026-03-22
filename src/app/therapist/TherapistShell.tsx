"use client";

import { OnboardingFlow } from "@/app/therapist/onboarding/OnboardingFlow";
import { useMyProfile } from "@/hooks/useProfile";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { TonConnectButton } from "@tonconnect/ui-react";
import { backButton } from "@tma.js/sdk-react";
import { usePathname, useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect, useState } from "react";

const tabs = [
  { path: "/therapist", label: "Dashboard", icon: "📅" },
  { path: "/therapist/availability", label: "Schedule", icon: "🕐" },
  { path: "/therapist/profile", label: "Profile", icon: "👤" },
];

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  );
}

function TherapistHeader() {
  const user = useTelegramUser();
  const displayName = user
    ? user.username
      ? `@${user.username}`
      : user.first_name
    : null;

  return (
    <header className="bg-background border-border sticky top-0 z-20 flex items-center justify-between border-b px-4 py-2">
      {displayName ? (
        <span className="text-sm font-medium">{displayName}</span>
      ) : (
        <span />
      )}
      <TonConnectButton />
    </header>
  );
}

function OnboardingGate({ children }: PropsWithChildren) {
  const token = useAuthStore((s) => s.supabaseToken);
  const { data: profile, isLoading } = useMyProfile();
  const [onboardingDone, setOnboardingDone] = useState(false);

  if (!token || isLoading) return <Spinner />;

  if (!onboardingDone && profile === null) {
    return <OnboardingFlow onDone={() => setOnboardingDone(true)} />;
  }

  return <>{children}</>;
}

export function TherapistShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();

  const isRoot = tabs.some((t) => t.path === pathname);

  useEffect(() => {
    try {
      if (isRoot) {
        backButton.hide();
      } else {
        backButton.show();
        return backButton.onClick(() => router.back());
      }
    } catch {}
  }, [isRoot, router]);

  return (
    <OnboardingGate>
      <div className="flex min-h-screen flex-col bg-slate-100">
        <TherapistHeader />
        <div className="mx-2 flex-1 overflow-x-hidden overflow-y-auto pb-16">
          {children}
        </div>
        <nav className="bg-card border-border fixed right-0 bottom-0 left-0 border-t">
          <div className="flex">
            {tabs.map((tab) => {
              const active = pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => router.push(tab.path)}
                  className={cn(
                    "flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent py-2 text-xs",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className="text-xl">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </OnboardingGate>
  );
}
