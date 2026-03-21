"use client";

import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { useClientBookings } from "@/hooks/useBookings";
import { formatTon } from "@/lib/ton";
import { useRouter } from "next/navigation";

export default function BookingsPage() {
  const router = useRouter();
  const { data: bookings, isLoading } = useClientBookings();

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bookings?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="font-medium text-foreground">No bookings yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Browse therapists to book your first session.
        </p>
      </div>
    );
  }

  const active = bookings.filter(
    (b) => !["fully_paid", "rejected", "cancelled"].includes(b.status)
  );
  const past = bookings.filter((b) =>
    ["fully_paid", "rejected", "cancelled"].includes(b.status)
  );

  return (
    <div className="space-y-4 py-4">
      {active.length > 0 && (
        <div>
          <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
            Active
          </p>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
            {active.map((booking) => (
              <button
                key={booking.id}
                className="flex items-center justify-between w-full px-4 py-3 bg-card hover:bg-accent text-left cursor-pointer border-none"
                onClick={() => router.push(`/client/pay/${booking.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {booking.therapist_profiles?.display_name ?? "Therapist"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {booking.booking_date} · {booking.start_time}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatTon(booking.amount_ton)}
                  </p>
                </div>
                <div className="ml-3 shrink-0">
                  <BookingStatusBadge status={booking.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
            Past
          </p>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
            {past.map((booking) => (
              <button
                key={booking.id}
                className="flex items-center justify-between w-full px-4 py-3 bg-card hover:bg-accent text-left cursor-pointer border-none"
                onClick={() =>
                  booking.status === "completed"
                    ? router.push(`/client/pay/${booking.id}`)
                    : undefined
                }
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {booking.therapist_profiles?.display_name ?? "Therapist"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {booking.booking_date} · {booking.start_time}
                  </p>
                </div>
                <div className="ml-3 shrink-0">
                  <BookingStatusBadge status={booking.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
