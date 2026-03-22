"use client";

import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { backButton } from "@tma.js/sdk-react";
import { List, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";

const tabs = [
  { path: "/client", label: "Browse", Icon: Search },
  { path: "/client/bookings", label: "Bookings", Icon: List },
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
    <div className="safe-botton-zone-2 bg-slate-100">
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-100">
        <Header />
        <div
          className={cn(
            "flex-1 overflow-x-hidden overflow-y-auto",
            !tabbarHidden && "mb-safe-bottom",
          )}
        >
          {children}
        </div>
        {!tabbarHidden && (
          <nav className="border-border fixed right-0 bottom-0 left-0 z-50 p-4 pb-12">
            <div className="bg-card/70 flex rounded-full p-1 shadow-2xl! backdrop-blur-lg">
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
        )}
      </div>
    </div>
  );
}
