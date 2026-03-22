"use client";

import { OnboardingFlow } from "@/app/therapist/onboarding/OnboardingFlow";
import { Header } from "@/components/Header";
import { useMyProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { backButton } from "@tma.js/sdk-react";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect } from "react";

const tabs = [
  { path: "/therapist", label: "Dashboard", Icon: CalendarDays },
  { path: "/therapist/availability", label: "Schedule", Icon: Clock },
  { path: "/therapist/profile", label: "Profile", Icon: UserRound },
];

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  );
}

function OnboardingGate({ children }: PropsWithChildren) {
  const token = useAuthStore((s) => s.supabaseToken);
  const { data: profile, isLoading } = useMyProfile();
  const router = useRouter();

  if (!token || isLoading) return <Spinner />;

  if (profile === null) {
    return (
      <OnboardingFlow onDone={() => router.push("/therapist/availability")} />
    );
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
        <Header />
        <div className="mx-2 mb-26 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
        <nav className="border-border fixed right-0 bottom-0 left-0 z-50 p-4 pb-12">
          <div className="bg-card/70 flex rounded-full p-1 shadow-2xl! backdrop-blur-lg">
            {tabs.map((tab) => {
              const active = pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => router.push(tab.path)}
                  className={cn(
                    "flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-full border-none bg-transparent py-2 text-xs",
                    active ? "bg-slate-500/25" : "text-muted-foreground",
                  )}
                >
                  <tab.Icon size={24} />
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
