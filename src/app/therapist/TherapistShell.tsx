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
    <div className="flex flex-col overflow-hidden bg-slate-100">
      <div className="mx-2 flex-1 overflow-x-hidden overflow-y-auto">
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
  );
}
