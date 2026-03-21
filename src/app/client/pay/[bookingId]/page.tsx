"use client";

import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { PayButton } from "@/components/PayButton";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBooking } from "@/hooks/useBookings";
import {
  usePayFinal,
  usePayUpfront,
  useRateAndPayFinal,
} from "@/hooks/usePayments";
import { formatTon } from "@/lib/ton";
import { use, useState } from "react";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default function PayPage({ params }: Props) {
  const { bookingId } = use(params);
  const { data: booking, isLoading } = useBooking(bookingId);
  const payUpfront = usePayUpfront();
  const payFinal = usePayFinal();
  const rateAndPay = useRateAndPayFinal();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [rated, setRated] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="font-medium text-foreground">Not found</p>
        <p className="text-sm text-muted-foreground mt-1">Booking not found.</p>
      </div>
    );
  }

  const therapist = booking.therapist_profiles;

  async function handleUpfront(boc: string) {
    const isFullPayment = booking!.upfront_percent === 100;
    await payUpfront.mutateAsync({ bookingId, txHash: boc, isFullPayment });
  }

  async function handleRate() {
    await rateAndPay.mutateAsync({
      bookingId,
      rating,
      review: review || undefined,
    });
    setRated(true);
  }

  async function handleFinal(boc: string) {
    await payFinal.mutateAsync({ bookingId, txHash: boc });
  }

  return (
    <div className="space-y-4 py-4">
      {/* Booking Details */}
      <div>
        <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
          Booking Details
        </p>
        <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">Status</span>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">Therapist</span>
            <span className="text-sm text-muted-foreground">
              {therapist?.display_name ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">Date</span>
            <span className="text-sm text-muted-foreground">
              {booking.booking_date}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">Time</span>
            <span className="text-sm text-muted-foreground">
              {booking.start_time}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">Duration</span>
            <span className="text-sm text-muted-foreground">
              {booking.duration_minutes} min
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">Total price</span>
            <span className="text-sm text-muted-foreground">
              {formatTon(booking.amount_ton)}
            </span>
          </div>
        </div>
      </div>

      {/* Upfront payment */}
      {booking.status === "confirmed" && therapist?.user_id && (
        <div>
          <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
            Payment
          </p>
          <div className="bg-card rounded-xl overflow-hidden mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm text-foreground">
                Pay upfront ({booking.upfront_percent}%)
              </span>
              <span className="text-sm text-muted-foreground">
                {formatTon(booking.upfront_amount)}
              </span>
            </div>
            <div className="px-4 pt-3 pb-4">
              <PayButton
                therapistWallet={therapist.user_id}
                amountTon={booking.upfront_amount}
                label={`Pay ${formatTon(booking.upfront_amount)} upfront`}
                onSuccess={handleUpfront}
              />
            </div>
          </div>
        </div>
      )}

      {/* Rate session */}
      {booking.status === "completed" && !rated && booking.rating == null && (
        <div>
          <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
            Rate your session
          </p>
          <div className="bg-card rounded-xl overflow-hidden mx-4 px-4 py-3 space-y-3">
            <div className="flex justify-center py-1">
              <StarRating value={rating} onChange={setRating} />
            </div>
            <Textarea
              placeholder="Optional review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
            <Button
              size="lg"
              className="w-full"
              onClick={handleRate}
              disabled={rating === 0 || rateAndPay.isPending}
              loading={rateAndPay.isPending}
            >
              Submit Rating
            </Button>
          </div>
        </div>
      )}

      {/* Final payment */}
      {booking.status === "completed" &&
        (rated || booking.rating != null) &&
        booking.upfront_percent < 100 &&
        therapist?.user_id && (
          <div>
            <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
              Final Payment
            </p>
            <div className="bg-card rounded-xl overflow-hidden mx-4">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm text-foreground">
                  Remaining amount
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatTon(booking.remaining_amount)}
                </span>
              </div>
              <div className="px-4 pt-3 pb-4">
                <PayButton
                  therapistWallet={therapist.user_id}
                  amountTon={booking.remaining_amount}
                  label={`Pay ${formatTon(booking.remaining_amount)} remaining`}
                  onSuccess={handleFinal}
                />
              </div>
            </div>
          </div>
        )}

      {/* All done */}
      {booking.status === "fully_paid" && (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <p className="font-medium text-foreground">All done!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Thank you for your payment. Enjoy your session!
          </p>
        </div>
      )}

      {/* Transaction hashes */}
      {booking.tx_hash_upfront && (
        <div>
          <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
            Transaction Hashes
          </p>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-foreground mb-1">
                Upfront TX
              </p>
              <p className="text-xs text-muted-foreground break-all">
                {booking.tx_hash_upfront}
              </p>
            </div>
            {booking.tx_hash_final && (
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-foreground mb-1">
                  Final TX
                </p>
                <p className="text-xs text-muted-foreground break-all">
                  {booking.tx_hash_final}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
