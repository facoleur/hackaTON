"use client";

import { BookingSuccessCard } from "@/components/BookingSuccessCard";
import { PayButton } from "@/components/PayButton";
import { useBookAndPay } from "@/hooks/useBookAndPay";
import { DAY_NAMES, formatTime } from "@/lib/date";
import { formatTon } from "@/lib/ton";
import type { Availability, TherapistProfile } from "@/lib/types";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  therapist: TherapistProfile;
  slots: Availability[];
  walletAddress: string | null | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingDrawer({
  therapist,
  slots,
  walletAddress,
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();
  const bookAndPay = useBookAndPay();

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [txHash, setTxHash] = useState<string | null>(null);

  const upfrontAmount = (therapist.price_ton * therapist.upfront_percent) / 100;
  const remainingAmount = therapist.price_ton - upfrontAmount;

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
  const canPay = !!selectedSlot && !!bookingDate;

  async function handlePaymentSuccess(boc: string) {
    if (!selectedSlot || !bookingDate) return;
    await bookAndPay.mutateAsync({
      therapist_id: therapist.id,
      booking_date: bookingDate,
      start_time: selectedSlot.start_time,
      duration_minutes: therapist.duration_minutes,
      amount_ton: therapist.price_ton,
      upfront_percent: therapist.upfront_percent,
      upfront_amount: upfrontAmount,
      remaining_amount: remainingAmount,
      txHash: boc,
    });
    setTxHash(boc);
    setStep("success");
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      <div className="bg-background fixed right-0 bottom-0 left-0 z-50 rounded-t-3xl px-4 pt-3 pb-12! shadow-2xl">
        <div className="bg-border mx-auto mb-5 h-1 w-10 rounded-full" />

        {step === "success" ? (
          <BookingSuccessCard
            therapistName={therapist.display_name}
            upfrontAmount={upfrontAmount}
            txHash={txHash}
            onViewBookings={() => router.push("/client/bookings")}
          />
        ) : (
          <>
            <h2 className="text-foreground mb-5 text-lg font-semibold">
              Book a session
            </h2>

            <div className="mb-4">
              <label className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border-border bg-card text-foreground focus:ring-primary/40 w-full appearance-none rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            {slots.length > 0 && (
              <div className="mb-6">
                <label className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider">
                  Time slot
                </label>
                <div className="flex flex-col gap-2">
                  {slots.map((slot) => {
                    const active = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          try {
                            hapticFeedback.impactOccurred("light");
                          } catch {}
                          setSelectedSlotId(slot.id);
                        }}
                        className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors"
                        style={{
                          borderColor: active
                            ? "var(--primary)"
                            : "var(--border)",
                          background: active
                            ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                            : "var(--card)",
                          color: active
                            ? "var(--primary)"
                            : "var(--foreground)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        <span>{DAY_NAMES[slot.day_of_week]}</span>
                        <span>
                          {formatTime(slot.start_time)} –{" "}
                          {formatTime(slot.end_time)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <PayButton
              therapistWallet={walletAddress}
              amountTon={upfrontAmount}
              label={`Pay ${formatTon(upfrontAmount)} now`}
              onSuccess={handlePaymentSuccess}
              disabled={!canPay}
            />
          </>
        )}
      </div>
    </>
  );
}
