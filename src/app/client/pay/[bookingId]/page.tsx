'use client';

import { use, useState } from 'react';
import {
  List,
  Section,
  Cell,
  Spinner,
  Placeholder,
  Textarea,
} from '@telegram-apps/telegram-ui';
import { useBooking } from '@/hooks/useBookings';
import { usePayUpfront, usePayFinal, useRateAndPayFinal } from '@/hooks/usePayments';
import { PayButton } from '@/components/PayButton';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';
import { StarRating } from '@/components/StarRating';
import { formatTon } from '@/lib/ton';

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
  const [review, setReview] = useState('');
  const [rated, setRated] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!booking) {
    return <Placeholder header="Not found" description="Booking not found." />;
  }

  const therapist = booking.therapist_profiles;
  const wallet = therapist?.user_id ?? '';

  async function handleUpfront(boc: string) {
    const isFullPayment = booking!.upfront_percent === 100;
    await payUpfront.mutateAsync({ bookingId, txHash: boc, isFullPayment });
  }

  async function handleRate() {
    await rateAndPay.mutateAsync({ bookingId, rating, review: review || undefined });
    setRated(true);
  }

  async function handleFinal(boc: string) {
    await payFinal.mutateAsync({ bookingId, txHash: boc });
  }

  return (
    <List>
      <Section header="Booking Details">
        <Cell after={<BookingStatusBadge status={booking.status} />}>Status</Cell>
        <Cell after={therapist?.display_name ?? '—'}>Therapist</Cell>
        <Cell after={booking.booking_date}>Date</Cell>
        <Cell after={booking.start_time}>Time</Cell>
        <Cell after={`${booking.duration_minutes} min`}>Duration</Cell>
        <Cell after={formatTon(booking.amount_ton)}>Total price</Cell>
      </Section>

      {booking.status === 'confirmed' && therapist?.user_id && (
        <Section header="Payment">
          <Cell after={formatTon(booking.upfront_amount)}>Pay upfront ({booking.upfront_percent}%)</Cell>
          <div style={{ padding: '8px 16px 16px' }}>
            <PayButton
              therapistWallet={therapist.user_id}
              amountTon={booking.upfront_amount}
              label={`Pay ${formatTon(booking.upfront_amount)} upfront`}
              onSuccess={handleUpfront}
            />
          </div>
        </Section>
      )}

      {booking.status === 'completed' && !rated && booking.rating == null && (
        <Section header="Rate your session">
          <div style={{ padding: '8px 16px' }}>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div style={{ padding: '0 16px' }}>
            <Textarea
              placeholder="Optional review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>
          <div style={{ padding: '8px 16px 16px' }}>
            <button
              onClick={handleRate}
              disabled={rating === 0 || rateAndPay.isPending}
              style={{
                background: 'var(--tg-theme-button-color, #2481cc)',
                color: 'var(--tg-theme-button-text-color, #fff)',
                border: 'none',
                borderRadius: 12,
                padding: '14px 24px',
                width: '100%',
                fontSize: 16,
                fontWeight: 600,
                cursor: rating === 0 ? 'default' : 'pointer',
                opacity: rating === 0 ? 0.5 : 1,
              }}
            >
              Submit Rating
            </button>
          </div>
        </Section>
      )}

      {(booking.status === 'completed' && (rated || booking.rating != null)) &&
        booking.upfront_percent < 100 &&
        therapist?.user_id && (
        <Section header="Final Payment">
          <Cell after={formatTon(booking.remaining_amount)}>Remaining amount</Cell>
          <div style={{ padding: '8px 16px 16px' }}>
            <PayButton
              therapistWallet={therapist.user_id}
              amountTon={booking.remaining_amount}
              label={`Pay ${formatTon(booking.remaining_amount)} remaining`}
              onSuccess={handleFinal}
            />
          </div>
        </Section>
      )}

      {booking.status === 'fully_paid' && (
        <Section>
          <Placeholder
            header="All done!"
            description="Thank you for your payment. Enjoy your session!"
          />
        </Section>
      )}

      {booking.tx_hash_upfront && (
        <Section header="Transaction Hashes">
          <Cell subtitle={booking.tx_hash_upfront} multiline>Upfront TX</Cell>
          {booking.tx_hash_final && (
            <Cell subtitle={booking.tx_hash_final} multiline>Final TX</Cell>
          )}
        </Section>
      )}
    </List>
  );
}
