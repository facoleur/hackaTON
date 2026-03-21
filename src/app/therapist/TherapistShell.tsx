"use client";

import { cn } from "@/lib/utils";
import { backButton } from "@tma.js/sdk-react";
import { usePathname, useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect } from "react";

const tabs = [
  { path: "/therapist", label: "Dashboard", icon: "📅" },
  { path: "/therapist/profile", label: "Profile", icon: "👤" },
  { path: "/therapist/availability", label: "Schedule", icon: "🕐" },
];

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
    <div className="flex h-[var(--tg-viewport-stable-height,100dvh)] flex-col overflow-hidden">
      <div className="flex-1 overflow-x-hidden overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
        {children}
      </div>
      <nav className="bg-card border-border fixed right-0 bottom-0 left-0 border-t pb-[env(safe-area-inset-bottom,0px)]">
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
  );
}
