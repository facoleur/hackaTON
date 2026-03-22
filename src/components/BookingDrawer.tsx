"use client";

import { BookingSuccessCard } from "@/components/BookingSuccessCard";
import { DurationPicker } from "@/components/DurationPicker";
import { PayButton } from "@/components/PayButton";
import { useBookAndPay } from "@/hooks/useBookAndPay";
import { useTherapistBookedDates } from "@/hooks/useTherapistBookedDates";
import { expandSlots, type DatedSlot } from "@/lib/date";
import { formatTon } from "@/lib/ton";
import type { Availability, TherapistProfile } from "@/lib/types";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  const bookedSet = useTherapistBookedDates(therapist.id);

  const [selected, setSelected] = useState<{ slotId: string; date: string } | null>(null);
  const [step, setStep] = useState<"form" | "success">("form");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1);

  const duration = therapist.duration_minutes * multiplier;
  const totalPrice = therapist.price_ton * multiplier;

  const datedSlots = useMemo(
    () => expandSlots(slots, bookedSet, duration),
    [slots, bookedSet, duration],
  );

  const selectedSlot = selected
    ? slots.find((s) => s.id === selected.slotId) ?? null
    : null;

  async function handlePaymentSuccess(boc: string) {
    if (!selectedSlot || !selected) return;
    await bookAndPay.mutateAsync({
      therapist_id: therapist.id,
      booking_date: selected.date,
      start_time: selectedSlot.start_time,
      duration_minutes: duration,
      amount_ton: totalPrice,
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
            amountPaid={totalPrice}
            txHash={txHash}
            onViewBookings={() => router.push("/client/bookings")}
          />
        ) : (
          <>
            <h2 className="text-foreground mb-5 text-lg font-semibold">
              Book a session
            </h2>

            {datedSlots.length > 0 ? (
              <div className="mb-6">
                <label className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider">
                  Available slots
                </label>
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {datedSlots.map((item: DatedSlot) => {
                    const active =
                      selected?.slotId === item.slot.id &&
                      selected?.date === item.date;
                    return (
                      <button
                        key={`${item.slot.id}-${item.date}`}
                        onClick={() => {
                          try {
                            hapticFeedback.impactOccurred("light");
                          } catch {}
                          setSelected({ slotId: item.slot.id, date: item.date });
                        }}
                        className="flex w-full items-center rounded-xl border px-4 py-3 text-sm transition-colors"
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
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground mb-6 text-sm">
                No available slots in the next 30 days.
              </p>
            )}

            <div className="mb-6">
              <DurationPicker
                base={therapist.duration_minutes}
                max={therapist.max_multiplier ?? 3}
                value={multiplier}
                onChange={(m) => { setMultiplier(m); setSelected(null); }}
              />
            </div>

            <PayButton
              therapistWallet={walletAddress}
              amountTon={totalPrice}
              label={`Pay ${formatTon(totalPrice)}`}
              onSuccess={handlePaymentSuccess}
              disabled={!selected}
            />
          </>
        )}
      </div>
    </>
  );
}
