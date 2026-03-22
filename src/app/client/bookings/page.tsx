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
        <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!bookings?.length) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-foreground font-medium">No bookings yet</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse therapists to book your first session.
        </p>
      </div>
    );
  }

  const active = bookings.filter(
    (b) => !["fully_paid", "rejected", "cancelled"].includes(b.status),
  );
  const past = bookings.filter((b) =>
    ["fully_paid", "rejected", "cancelled"].includes(b.status),
  );

  return (
    <div className="space-y-4 py-4">
      {active.length > 0 && (
        <section>
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            Active
          </p>
          <div className="divide-border mx-4 space-y-1! divide-y overflow-hidden rounded-xl">
            {active.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={
                  booking as typeof booking & {
                    therapist_profiles: TherapistProfile;
                  }
                }
                onClick={() => router.push(`/client/pay/${booking.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            Past
          </p>
          <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
            {past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={
                  booking as typeof booking & {
                    therapist_profiles: TherapistProfile;
                  }
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
