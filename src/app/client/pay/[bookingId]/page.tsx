"use client";

import { BookingInfoCard } from "@/components/BookingInfoCard";
import { BookingRating } from "@/components/BookingRating";
import { PayButton } from "@/components/PayButton";
import { RateSessionForm } from "@/components/RateSessionForm";
import { TransactionHashesCard } from "@/components/TransactionHashesCard";
import { useBooking } from "@/hooks/useBookings";
import {
  useCancelRating,
  usePay,
  useRateSession,
} from "@/hooks/usePayments";
import { formatTon } from "@/lib/ton";
import type { TherapistProfile } from "@/lib/types";
import { use, useState } from "react";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default function PayPage({ params }: Props) {
  const { bookingId } = use(params);
  const { data: booking, isLoading } = useBooking(bookingId);

  const pay = usePay();
  const rateSession = useRateSession();
  const cancelRating = useCancelRating();

  const [rated, setRated] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!booking || !booking.therapist_profiles) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-foreground font-medium">Not found</p>
        <p className="text-muted-foreground mt-1 text-sm">Booking not found.</p>
      </div>
    );
  }

  const bookingWithTherapist = booking as typeof booking & {
    therapist_profiles: TherapistProfile;
  };
  const therapistWallet = booking.therapist_profiles.wallet_address;

  const hasRating = booking.rating != null || rated;
  const effectiveRating = booking.rating ?? 0;

  async function handlePay(boc: string) {
    await pay.mutateAsync({ bookingId, txHash: boc });
  }

  async function handleRate(rating: number) {
    await rateSession.mutateAsync({ bookingId, rating });
    setRated(true);
  }

  async function handleCancelRating() {
    await cancelRating.mutateAsync({ bookingId });
    setRated(false);
  }

  return (
    <div className="space-y-4 py-4">
      <BookingInfoCard booking={bookingWithTherapist} />

      {/* Payment */}
      {booking.status === "confirmed" && (
        <div>
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            Payment
          </p>
          <div className="bg-card mx-4 overflow-hidden rounded-xl">
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <span className="text-foreground text-sm">Total</span>
              <span className="text-muted-foreground text-sm">
                {formatTon(booking.amount_ton)}
              </span>
            </div>
            <div className="px-4 pt-3 pb-4">
              <PayButton
                therapistWallet={therapistWallet}
                amountTon={booking.amount_ton}
                label={`Pay ${formatTon(booking.amount_ton)}`}
                onSuccess={handlePay}
              />
            </div>
          </div>
        </div>
      )}

      {/* Rating section (session completed) */}
      {booking.status === "completed" && !hasRating && (
        <RateSessionForm
          isPending={rateSession.isPending}
          onSubmit={handleRate}
        />
      )}

      {booking.status === "completed" && hasRating && (
        <BookingRating
          rating={effectiveRating}
          isCancelling={cancelRating.isPending}
          onCancel={handleCancelRating}
        />
      )}

      {/* All done */}
      {booking.status === "fully_paid" && (
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
          <p className="text-foreground font-medium">All done!</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Thank you for your payment. Enjoy your session!
          </p>
        </div>
      )}

      <TransactionHashesCard txHash={booking.tx_hash} />
    </div>
  );
}
