"use client";

import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { Button } from "@/components/ui/button";
import {
  useCompleteBooking,
  useConfirmBooking,
  useRejectBooking,
  useTherapistBookings,
} from "@/hooks/useBookings";
import { useMyProfile } from "@/hooks/useProfile";
import { formatTon } from "@/lib/ton";
import { hapticFeedback } from "@tma.js/sdk-react";

export default function TherapistDashboard() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: bookings, isLoading: bookingsLoading } = useTherapistBookings(
    profile?.id ?? "",
  );
  const confirm = useConfirmBooking();
  const reject = useRejectBooking();
  const complete = useCompleteBooking();

  if (profileLoading || bookingsLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-foreground font-medium">Set up your profile</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Go to the Profile tab to create your therapist profile.
        </p>
      </div>
    );
  }

  const pending = bookings?.filter((b) => b.status === "pending") ?? [];
  const active =
    bookings?.filter((b) => ["confirmed", "upfront_paid"].includes(b.status)) ??
    [];
  const history =
    bookings?.filter((b) =>
      ["completed", "fully_paid", "rejected", "cancelled"].includes(b.status),
    ) ?? [];

  async function handleConfirm(id: string) {
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
    await confirm.mutateAsync(id);
    try {
      hapticFeedback.notificationOccurred("success");
    } catch {}
  }

  async function handleReject(id: string) {
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
    await reject.mutateAsync(id);
  }

  async function handleComplete(id: string) {
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
    await complete.mutateAsync(id);
    try {
      hapticFeedback.notificationOccurred("success");
    } catch {}
  }

  return (
    <div className="space-y-4 py-4">
      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            Requests ({pending.length})
          </p>
          <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
            {pending.map((b) => (
              <div key={b.id} className="px-4 py-3">
                <p className="text-foreground text-sm font-medium">
                  {b.users?.first_name ?? "Client"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {b.booking_date} · {b.start_time} · {b.duration_minutes} min
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatTon(b.amount_ton)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(b.id)}
                    loading={confirm.isPending}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(b.id)}
                    loading={reject.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active sessions */}
      {active.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            Active Sessions
          </p>
          <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
            {active.map((b) => (
              <div key={b.id} className="px-4 py-3">
                <p className="text-foreground text-sm font-medium">
                  {b.users?.first_name ?? "Client"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {b.booking_date} · {b.start_time}
                </p>
                <div className="mt-1">
                  <BookingStatusBadge status={b.status} />
                </div>
                {b.status === "upfront_paid" && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleComplete(b.id)}
                      loading={complete.isPending}
                    >
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
            History
          </p>
          <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
            {history.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {b.users?.first_name ?? "Client"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {b.booking_date} · {formatTon(b.amount_ton)}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!bookings?.length && (
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
          <p className="text-foreground font-medium">No bookings yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Once clients book sessions, they'll appear here.
          </p>
        </div>
      )}
    </div>
  );
}
