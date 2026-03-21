"use client";

import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { backButton } from "@tma.js/sdk-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";

const tabs = [
  { path: "/client", label: "Browse", icon: "🔍" },
  { path: "/client/bookings", label: "Bookings", icon: "📋" },
];

export function ClientShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const tabbarHidden = useUIStore((s) => s.tabbarHidden);

  const isRoot = pathname === "/client" || pathname === "/client/bookings";

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
    <div className="flex flex-col overflow-hidden bg-slate-100 safe-botton-zone-2">
      <Header />
      <div className={cn("flex-1 overflow-x-hidden overflow-y-auto", !tabbarHidden && "mb-safe-bottom")}>
        {children}
      </div>
      {!tabbarHidden && <nav className="bg-card border-border fixed right-0 bottom-0 left-0 border-t">
        <div className="flex bg-white safe-botton-zone">
          {tabs.map((tab) => {
            const active =
              tab.path === "/client"
                ? pathname === "/client"
                : pathname.startsWith(tab.path);
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
      </nav>}
    </div>
  );
}
