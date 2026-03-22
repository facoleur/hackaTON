import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { StarRating } from "@/components/StarRating";
import { formatBookingDate, formatTime } from "@/lib/date";
import { formatTon } from "@/lib/ton";
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
      className="flex w-full gap-3 px-4 py-3 bg-card hover:bg-accent text-left border-none"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-muted flex items-center justify-center">
        {photo ? (
          <img
            src={photo}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-semibold text-muted-foreground">
            {profile.display_name[0]}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">
            {profile.display_name}
          </p>
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Date + time — prominent */}
        <p className="text-base font-bold text-foreground mt-1 leading-tight">
          {formatBookingDate(booking.booking_date)}
        </p>
        <p className="text-sm font-semibold text-foreground leading-tight">
          {formatTime(booking.start_time)}
          {" · "}
          {booking.duration_minutes} min
        </p>

        {/* Location + price — secondary */}
        <div className="flex items-center gap-2 mt-0.5">
          {profile.location_name && (
            <p className="text-xs text-muted-foreground truncate">
              {profile.location_name}
            </p>
          )}
          <p className="text-xs text-muted-foreground shrink-0">
            {formatTon(booking.amount_ton)}
          </p>
          {booking.rating != null && (
            <StarRating value={booking.rating} readonly size={12} />
          )}
        </div>
      </div>
    </button>
  );
}
