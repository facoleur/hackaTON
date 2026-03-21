"use client";

import { useTelegramUser } from "@/hooks/useTelegramUser";
import { TonConnectButton } from "@tonconnect/ui-react";

export function Header() {
  const user = useTelegramUser();
  const displayName = user
    ? user.username
      ? `@${user.username}`
      : user.first_name
    : null;

  return (
    <header className="bg-background border-border sticky top-0 z-20 flex items-center justify-between border-b px-4 py-2">
      {displayName && (
        <span className="text-sm font-medium">{displayName}</span>
      )}
      <TonConnectButton />
    </header>
  );
}
