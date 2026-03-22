import type { SendTransactionRequest } from "@tonconnect/ui-react";

/**
 * Converts a user-friendly TON address (UQ.../EQ...) to raw format (workchain:hex).
 * TonConnect requires raw format in SendTransactionRequest messages.
 */
function toRawAddress(address: string): string {
  if (address.includes(":")) return address; // already raw

  const base64 = address.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const workchain = binary.charCodeAt(1) === 0xff ? -1 : binary.charCodeAt(1);
  const hash = Array.from({ length: 32 }, (_, i) =>
    binary
      .charCodeAt(i + 2)
      .toString(16)
      .padStart(2, "0"),
  ).join("");
  return `${workchain}:${hash}`;
}

export function buildPayTransaction(
  recipientWallet: string,
  amountTon: number,
): SendTransactionRequest {
  const nanotons = Math.round(amountTon * 1e9).toString();

  return {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        // address: toRawAddress(recipientWallet),
        address: recipientWallet,
        amount: nanotons,
      },
    ],
  };
}

export function formatTon(amount: number): string {
  return `${amount.toFixed(2)} TON`;
}
