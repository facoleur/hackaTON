import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { formatBookingDate, formatTime } from "@/lib/date";
import { formatTon } from "@/lib/ton";
import type { Booking, TherapistProfile } from "@/lib/types";

interface Props {
  booking: Booking & { therapist_profiles: TherapistProfile };
}

export function BookingInfoCard({ booking }: Props) {
  const profile = booking.therapist_profiles;
  const photo = profile.photos?.[0];

  return (
    <div className="mx-4 bg-card rounded-xl overflow-hidden">
      {/* Hero photo */}
      {photo && (
        <div className="w-full aspect-[16/7] overflow-hidden">
          <img
            src={photo}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header: name + location + status */}
      <div className="px-4 pt-3 pb-2 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate">
              {profile.display_name}
            </p>
            {profile.location_name && (
              <p className="text-sm text-muted-foreground truncate">
                {profile.location_name}
              </p>
            )}
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Prominent date + time */}
        <div className="mt-2">
          <p className="text-2xl font-bold text-foreground leading-tight">
            {formatBookingDate(booking.booking_date)}
          </p>
          <p className="text-lg font-semibold text-foreground leading-tight">
            {formatTime(booking.start_time)}
            {" · "}
            {booking.duration_minutes} min
          </p>
        </div>
      </div>

      {/* Detail rows */}
      <div className="divide-y divide-border">
        <InfoRow label="Total">{formatTon(booking.amount_ton)}</InfoRow>
        {booking.upfront_percent < 100 && (
          <>
            <InfoRow label={`Upfront (${booking.upfront_percent}%)`}>
              {formatTon(booking.upfront_amount)}
            </InfoRow>
            <InfoRow label="Remaining">
              {formatTon(booking.remaining_amount)}
            </InfoRow>
          </>
        )}
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
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  );
}
