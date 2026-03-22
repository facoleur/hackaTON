'use client';

import type { BookingStatus } from '@/lib/types';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Session Done',
  fully_paid: 'Paid',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  return (
    <span className={`status-badge status-badge-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
