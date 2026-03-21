'use client';

import { useRouter } from 'next/navigation';
import {
  List,
  Section,
  Cell,
  Spinner,
  Placeholder,
} from '@telegram-apps/telegram-ui';
import { useClientBookings } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';
import { formatTon } from '@/lib/ton';

export default function BookingsPage() {
  const router = useRouter();
  const { data: bookings, isLoading } = useClientBookings();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!bookings?.length) {
    return (
      <Placeholder
        header="No bookings yet"
        description="Browse therapists to book your first session."
      />
    );
  }

  const active = bookings.filter(
    (b) => !['fully_paid', 'rejected', 'cancelled'].includes(b.status)
  );
  const past = bookings.filter((b) =>
    ['fully_paid', 'rejected', 'cancelled'].includes(b.status)
  );

  return (
    <List>
      {active.length > 0 && (
        <Section header="Active">
          {active.map((booking) => (
            <Cell
              key={booking.id}
              subtitle={
                <div style={{ marginTop: 4 }}>
                  <div>{booking.booking_date} · {booking.start_time}</div>
                  <div style={{ marginTop: 2 }}>
                    Total: {formatTon(booking.amount_ton)}
                  </div>
                </div>
              }
              after={<BookingStatusBadge status={booking.status} />}
              onClick={() => router.push(`/client/pay/${booking.id}`)}
            >
              {booking.therapist_profiles?.display_name ?? 'Therapist'}
            </Cell>
          ))}
        </Section>
      )}

      {past.length > 0 && (
        <Section header="Past">
          {past.map((booking) => (
            <Cell
              key={booking.id}
              subtitle={`${booking.booking_date} · ${booking.start_time}`}
              after={<BookingStatusBadge status={booking.status} />}
              onClick={() =>
                booking.status === 'completed'
                  ? router.push(`/client/pay/${booking.id}`)
                  : undefined
              }
            >
              {booking.therapist_profiles?.display_name ?? 'Therapist'}
            </Cell>
          ))}
        </Section>
      )}
    </List>
  );
}
