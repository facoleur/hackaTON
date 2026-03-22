import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { formatTon } from "@/lib/ton";
import type { Booking, TherapistProfile } from "@/lib/types";

interface Props {
  booking: Booking & { therapist_profiles: TherapistProfile };
}

export function BookingInfoCard({ booking }: Props) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
        Booking Details
      </p>
      <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
        <InfoRow label="Status">
          <BookingStatusBadge status={booking.status} />
        </InfoRow>
        <InfoRow label="Therapist">
          {booking.therapist_profiles.display_name}
        </InfoRow>
        <InfoRow label="Date">{booking.booking_date}</InfoRow>
        <InfoRow label="Time">{booking.start_time}</InfoRow>
        <InfoRow label="Duration">{booking.duration_minutes} min</InfoRow>
        <InfoRow label="Total price">{formatTon(booking.amount_ton)}</InfoRow>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-foreground text-sm">{label}</span>
      <span className="text-muted-foreground text-sm">{children}</span>
    </div>
  );
}
