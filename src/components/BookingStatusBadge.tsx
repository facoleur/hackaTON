'use client';

import type { BookingStatus } from '@/lib/types';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  upfront_paid: 'Upfront Paid',
  completed: 'Session Done',
  fully_paid: 'Paid',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'var(--tg-theme-hint-color, #999)',
  confirmed: 'var(--tg-theme-button-color, #2481cc)',
  upfront_paid: 'var(--tg-theme-button-color, #2481cc)',
  completed: '#f59e0b',
  fully_paid: '#22c55e',
  rejected: '#ef4444',
  cancelled: '#ef4444',
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 10,
        background: STATUS_COLORS[status] + '22',
        color: STATUS_COLORS[status],
        display: 'inline-block',
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
