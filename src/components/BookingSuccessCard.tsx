"use client";

import { Button } from "@/components/ui/button";
import { formatTon } from "@/lib/ton";

interface BookingSuccessCardProps {
  therapistName: string;
  amountPaid: number;
  txHash: string | null;
  onViewBookings: () => void;
}

export function BookingSuccessCard({
  therapistName,
  amountPaid,
  txHash,
  onViewBookings,
}: BookingSuccessCardProps) {
  return (
    <div className="flex flex-col items-center py-4 pb-2 text-center">
      <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="text-foreground mb-1 text-xl font-bold">
        Booking confirmed!
      </h2>
      <p className="text-muted-foreground mb-1 text-sm">
        {formatTon(amountPaid)} sent to {therapistName}
      </p>
      {txHash && (
        <p className="text-muted-foreground mb-6 max-w-xs text-xs break-all opacity-60">
          tx: {txHash.slice(0, 32)}…
        </p>
      )}
      <Button size="lg" className="w-full rounded-2xl" onClick={onViewBookings}>
        View my bookings
      </Button>
    </div>
  );
}
