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
import { useTherapistWalletAddress } from "@/hooks/useTherapistWalletAddress";
import { formatTon } from "@/lib/ton";
import { use, useState } from "react";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default function PayPage({ params }: Props) {
  const { bookingId } = use(params);
  const { data: booking, isLoading } = useBooking(bookingId);

  const { data: therapistWalletAddress } = useTherapistWalletAddress(
    booking?.therapist_profiles?.id ?? "",
  );

  const payUpfront = usePayUpfront();
  const payFinal = usePayFinal();
  const rateAndPay = useRateAndPayFinal();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [rated, setRated] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!booking || !booking.therapist_profiles || !therapistWalletAddress) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-foreground font-medium">Not found</p>
        <p className="text-muted-foreground mt-1 text-sm">Booking not found.</p>
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
        <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
          Booking Details
        </p>
        <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-foreground text-sm">Status</span>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-foreground text-sm">Therapist</span>
            <span className="text-muted-foreground text-sm">
              {therapist?.display_name ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-foreground text-sm">Date</span>
            <span className="text-muted-foreground text-sm">
              {booking.booking_date}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-foreground text-sm">Time</span>
            <span className="text-muted-foreground text-sm">
              {booking.start_time}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-foreground text-sm">Duration</span>
            <span className="text-muted-foreground text-sm">
              {booking.duration_minutes} min
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-foreground text-sm">Total price</span>
            <span className="text-muted-foreground text-sm">
              {formatTon(booking.amount_ton)}
            </span>
          </div>
        </div>
      </div>

      {/* Upfront payment */}
      {booking.status === "confirmed" && therapist?.user_id && (
        <div>
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            Payment
          </p>
          <div className="bg-card mx-4 overflow-hidden rounded-xl">
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <span className="text-foreground text-sm">
                Pay upfront ({booking.upfront_percent}%)
              </span>
              <span className="text-muted-foreground text-sm">
                {formatTon(booking.upfront_amount)}
              </span>
            </div>
            <div className="px-4 pt-3 pb-4">
              <PayButton
                therapistWallet={therapistWalletAddress}
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
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            Rate your session
          </p>
          <div className="bg-card mx-4 space-y-3 overflow-hidden rounded-xl px-4 py-3">
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
            <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
              Final Payment
            </p>
            <div className="bg-card mx-4 overflow-hidden rounded-xl">
              <div className="border-border flex items-center justify-between border-b px-4 py-3">
                <span className="text-foreground text-sm">
                  Remaining amount
                </span>
                <span className="text-muted-foreground text-sm">
                  {formatTon(booking.remaining_amount)}
                </span>
              </div>
              <div className="px-4 pt-3 pb-4">
                <PayButton
                  therapistWallet={therapistWalletAddress}
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
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
          <p className="text-foreground font-medium">All done!</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Thank you for your payment. Enjoy your session!
          </p>
        </div>
      )}

      {/* Transaction hashes */}
      {booking.tx_hash_upfront && (
        <div>
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            Transaction Hashes
          </p>
          <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
            <div className="px-4 py-3">
              <p className="text-foreground mb-1 text-sm font-medium">
                Upfront TX
              </p>
              <p className="text-muted-foreground text-xs break-all">
                {booking.tx_hash_upfront}
              </p>
            </div>
            {booking.tx_hash_final && (
              <div className="px-4 py-3">
                <p className="text-foreground mb-1 text-sm font-medium">
                  Final TX
                </p>
                <p className="text-muted-foreground text-xs break-all">
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
