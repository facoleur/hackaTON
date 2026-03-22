"use client";

import { BookingCard } from "@/components/BookingCard";
import { BookingCardSkeleton } from "@/components/BookingCardSkeleton";
import { useClientBookings } from "@/hooks/useBookings";
import type { TherapistProfile } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function BookingsPage() {
  const router = useRouter();
  const { data: bookings, isLoading } = useClientBookings();

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
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
        <section>
          <p className="px-4 text-xs font-medium text-muted-foreground tracking-wide mb-1">
            Active
          </p>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
            {active.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking as typeof booking & { therapist_profiles: TherapistProfile }}
                onClick={() => router.push(`/client/pay/${booking.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="px-4 text-xs font-medium text-muted-foreground tracking-wide mb-1">
            Past
          </p>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
            {past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking as typeof booking & { therapist_profiles: TherapistProfile }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
