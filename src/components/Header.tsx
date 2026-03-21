"use client";

import { TonConnectButton } from "@tonconnect/ui-react";

export function Header() {
  return (
    <header className="bg-background border-border sticky top-0 z-20 flex items-center justify-end border-b px-4 py-2">
      <TonConnectButton />
    </header>
  );
}
