import type { SendTransactionRequest } from "@tonconnect/ui-react";

export function buildPayTransaction(
  recipientWallet: string,
  amountTon: number,
): SendTransactionRequest {
  const nanotons = Math.round(amountTon * 1e9).toString();

  console.log("recipientWallet: ", recipientWallet);

  return {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        address: recipientWallet,
        amount: nanotons,
      },
    ],
  };
}

export function formatTon(amount: number): string {
  return `${amount.toFixed(2)} TON`;
}
