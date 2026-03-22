"use client";

import { buildPayTransaction } from "@/lib/ton";
import { Button } from "@telegram-apps/telegram-ui";
import {
  closingBehavior,
  hapticFeedback,
  swipeBehavior,
} from "@tma.js/sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useState } from "react";

interface PayButtonProps {
  therapistWallet: string | null | undefined;
  amountTon: number;
  label: string;
  onSuccess: (boc: string) => void;
  disabled?: boolean;
}

export function PayButton({
  therapistWallet,
  amountTon,
  label,
  onSuccess,
  disabled,
}: PayButtonProps) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [loading, setLoading] = useState(false);

  console.log("[PayButton] render", {
    wallet: !!wallet,
    therapistWallet,
    amountTon,
    disabled,
    isDisabled: disabled || loading || !therapistWallet,
  });

  async function handlePay() {
    console.log("[PayButton] clicked", { wallet: !!wallet, therapistWallet, amountTon, disabled });

    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}

    if (!wallet) {
      console.log("[PayButton] no wallet — opening modal");
      tonConnectUI.openModal();
      return;
    }

    if (!therapistWallet) {
      console.warn("[PayButton] no therapistWallet — aborting");
      return;
    }

    setLoading(true);

    try {
      closingBehavior.enableConfirmation();
    } catch {}
    try {
      swipeBehavior.disableVertical();
    } catch {}

    try {
      const tx = buildPayTransaction(therapistWallet, amountTon);
      console.log("[PayButton] sending transaction", tx);
      const result = await tonConnectUI.sendTransaction(tx);
      console.log("[PayButton] transaction result", result);
      try {
        hapticFeedback.notificationOccurred("success");
      } catch {}
      onSuccess(result.boc);
    } catch (err) {
      console.error("[PayButton] payment failed", err);
      try {
        hapticFeedback.notificationOccurred("error");
      } catch {}
    } finally {
      setLoading(false);
      try {
        closingBehavior.disableConfirmation();
      } catch {}
      try {
        swipeBehavior.enableVertical();
      } catch {}
    }
  }

  return (
    <Button
      size="l"
      stretched
      loading={loading}
      disabled={disabled || loading || !therapistWallet}
      onClick={handlePay}
    >
      {wallet ? label : "Connect Wallet to Pay"}
    </Button>
  );
}
