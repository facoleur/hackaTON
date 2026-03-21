'use client';

import {
  List,
  Section,
  Cell,
  Spinner,
  Placeholder,
  Button,
} from '@telegram-apps/telegram-ui';
import { useMyProfile } from '@/hooks/useProfile';
import { useTherapistBookings } from '@/hooks/useBookings';
import { useConfirmBooking, useRejectBooking, useCompleteBooking } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';
import { formatTon } from '@/lib/ton';
import { hapticFeedback } from '@tma.js/sdk-react';

export default function TherapistDashboard() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: bookings, isLoading: bookingsLoading } = useTherapistBookings(profile?.id ?? '');
  const confirm = useConfirmBooking();
  const reject = useRejectBooking();
  const complete = useCompleteBooking();

  if (profileLoading || bookingsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Placeholder
        header="Set up your profile"
        description="Go to the Profile tab to create your therapist profile."
      />
    );
  }

  const pending = bookings?.filter((b) => b.status === 'pending') ?? [];
  const active = bookings?.filter((b) =>
    ['confirmed', 'upfront_paid'].includes(b.status)
  ) ?? [];
  const history = bookings?.filter((b) =>
    ['completed', 'fully_paid', 'rejected', 'cancelled'].includes(b.status)
  ) ?? [];

  async function handleConfirm(id: string) {
    try { hapticFeedback.impactOccurred('medium'); } catch {}
    await confirm.mutateAsync(id);
    try { hapticFeedback.notificationOccurred('success'); } catch {}
  }

  async function handleReject(id: string) {
    try { hapticFeedback.impactOccurred('medium'); } catch {}
    await reject.mutateAsync(id);
  }

  async function handleComplete(id: string) {
    try { hapticFeedback.impactOccurred('medium'); } catch {}
    await complete.mutateAsync(id);
    try { hapticFeedback.notificationOccurred('success'); } catch {}
  }

  return (
    <List>
      {pending.length > 0 && (
        <Section header={`Requests (${pending.length})`}>
          {pending.map((b) => (
            <Cell
              key={b.id}
              subtitle={
                <div style={{ marginTop: 4 }}>
                  <div>{b.booking_date} · {b.start_time} · {b.duration_minutes} min</div>
                  <div style={{ marginTop: 2 }}>{formatTon(b.amount_ton)}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button
                      size="s"
                      onClick={() => handleConfirm(b.id)}
                      loading={confirm.isPending}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="s"
                      mode="plain"
                      onClick={() => handleReject(b.id)}
                      loading={reject.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              }
              multiline
            >
              {b.users?.first_name ?? 'Client'}
            </Cell>
          ))}
        </Section>
      )}

      {active.length > 0 && (
        <Section header="Active Sessions">
          {active.map((b) => (
            <Cell
              key={b.id}
              subtitle={
                <div style={{ marginTop: 4 }}>
                  <div>{b.booking_date} · {b.start_time}</div>
                  <div style={{ marginTop: 2 }}><BookingStatusBadge status={b.status} /></div>
                  {b.status === 'upfront_paid' && (
                    <div style={{ marginTop: 8 }}>
                      <Button
                        size="s"
                        onClick={() => handleComplete(b.id)}
                        loading={complete.isPending}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  )}
                </div>
              }
              multiline
            >
              {b.users?.first_name ?? 'Client'}
            </Cell>
          ))}
        </Section>
      )}

      {history.length > 0 && (
        <Section header="History">
          {history.map((b) => (
            <Cell
              key={b.id}
              subtitle={`${b.booking_date} · ${formatTon(b.amount_ton)}`}
              after={<BookingStatusBadge status={b.status} />}
            >
              {b.users?.first_name ?? 'Client'}
            </Cell>
          ))}
        </Section>
      )}

      {!bookings?.length && (
        <Placeholder
          header="No bookings yet"
          description="Once clients book sessions, they'll appear here."
        />
      )}
    </List>
  );
}
