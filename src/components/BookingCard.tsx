import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { StarRating } from "@/components/StarRating";
import { formatBookingDate, formatTime } from "@/lib/date";
import type { Booking, TherapistProfile } from "@/lib/types";

interface Props {
  booking: Booking & { therapist_profiles: TherapistProfile };
  onClick?: () => void;
}

export function BookingCard({ booking, onClick }: Props) {
  const profile = booking.therapist_profiles;
  const photo = profile.photos?.[0];

  return (
    <button
      className="hover:bg-accent bg-card flex w-full gap-3 rounded-2xl border-none px-2 py-2 text-left"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="bg-muted flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl">
        {photo ? (
          <img
            src={photo}
            alt={profile.display_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-muted-foreground text-2xl font-semibold">
            {profile.display_name[0]}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* Name + badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-foreground truncate text-sm leading-tight font-semibold">
            {profile.display_name}
          </p>
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Date + time — prominent */}
        <p className="text-foreground mt-1 text-base leading-tight font-bold">
          {formatBookingDate(booking.booking_date)},{" "}
          {formatTime(booking.start_time)}
        </p>
        <p className="text-foreground-muted text-sm leading-tight font-semibold"></p>

        {/* Location + price — secondary */}
        <div className="mt-0.5 flex items-center gap-2">
          {profile.location_name && (
            <p className="text-muted-foreground truncate text-xs">
              {profile.location_name}
            </p>
          )}
          {booking.rating != null && (
            <StarRating value={booking.rating} readonly size={12} />
          )}
        </div>
      </div>
    </button>
  );
}
