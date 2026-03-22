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

  async function handlePay() {
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}

    if (!wallet) {
      tonConnectUI.openModal();
      return;
    }

    if (!therapistWallet) return;

    setLoading(true);

    try {
      closingBehavior.enableConfirmation();
    } catch {}
    try {
      swipeBehavior.disableVertical();
    } catch {}

    try {
      const tx = buildPayTransaction(therapistWallet, amountTon);
      const result = await tonConnectUI.sendTransaction(tx);
      try {
        hapticFeedback.notificationOccurred("success");
      } catch {}
      onSuccess(result.boc);
    } catch (err) {
      console.error("Payment failed", err);
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
