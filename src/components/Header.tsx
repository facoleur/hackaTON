"use client";

import { useTelegramUser } from "@/hooks/useTelegramUser";
import { TonConnectButton } from "@tonconnect/ui-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const user = useTelegramUser();
  const pathname = usePathname();
  const displayName = user
    ? user.username
      ? `@${user.username}`
      : user.first_name
    : null;

  const isTherapist = pathname?.startsWith("/therapist");
  const switchHref = isTherapist ? "/client" : "/therapist";
  const switchLabel = isTherapist ? "you want fun?" : "you are a pro?";

  return (
    <header className="bg-background border-border sticky top-0 z-20 flex items-center justify-between border-b px-4 py-2">
      {displayName && (
        <span className="text-sm font-medium">{displayName}</span>
      )}
      <div className="flex items-center gap-3">
        <Link
          href={switchHref}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          {switchLabel}
        </Link>
        <TonConnectButton />
      </div>
    </header>
  );
}
