"use client";

import { useTherapistDashboard } from "@/app/therapist/hooks/useTherapistDashboard";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { Button } from "@/components/ui/button";
import { useAvailability } from "@/hooks/useAvailability";
import { formatTime } from "@/lib/date";
import { formatTon } from "@/lib/ton";
import { useRouter } from "next/navigation";

function NoAvailabilityBanner({ onPress }: { onPress: () => void }) {
  return (
    <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-900">No availability set</p>
      <p className="mt-0.5 text-xs text-amber-700">
        Clients can&apos;t book you until you add schedule slots.
      </p>
      <button
        onClick={onPress}
        className="mt-2 text-xs font-medium text-amber-900 underline"
      >
        Set availability →
      </button>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="6" y="10" width="28" height="24" rx="3" fill="#e2e8f0" />
          <rect x="6" y="10" width="28" height="7" rx="3" fill="#94a3b8" />
          <rect x="12" y="22" width="8" height="2" rx="1" fill="#94a3b8" />
          <rect x="12" y="27" width="14" height="2" rx="1" fill="#cbd5e1" />
          <circle cx="30" cy="30" r="7" fill="#3b82f6" />
          <path
            d="M27 30l2 2 4-4"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-foreground text-base font-semibold">
        No bookings yet
      </p>
      <p className="text-muted-foreground mt-1.5 max-w-[200px] text-sm leading-relaxed">
        New session requests from clients will show up here.
      </p>
    </div>
  );
}

function NoProfileState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="20" cy="15" r="8" fill="#cbd5e1" />
          <path
            d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="30" cy="30" r="7" fill="#3b82f6" />
          <path
            d="M30 27v3h3"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-foreground text-base font-semibold">
        Set up your profile
      </p>
      <p className="text-muted-foreground mt-1.5 max-w-[200px] text-sm leading-relaxed">
        Go to the Profile tab to create your therapist profile.
      </p>
    </div>
  );
}

export default function TherapistDashboard() {
  const {
    profile,
    isLoading,
    bookings,
    pending,
    active,
    history,
    handleConfirm,
    handleReject,
    handleComplete,
    isConfirming,
    isRejecting,
    isCompleting,
  } = useTherapistDashboard();
  const { data: slots } = useAvailability(profile?.id ?? "");
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!profile) return <NoProfileState />;

  const noSlots = slots !== undefined && slots.length === 0;

  if (!bookings?.length) return (
    <>
      {noSlots && <NoAvailabilityBanner onPress={() => router.push("/therapist/availability")} />}
      <EmptyDashboard />
    </>
  );

  return (
    <div className="space-y-4 py-4">
      {noSlots && <NoAvailabilityBanner onPress={() => router.push("/therapist/availability")} />}
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
                  {b.booking_date} · {formatTime(b.start_time)} · {b.duration_minutes} min
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatTon(b.amount_ton)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(b.id)}
                    loading={isConfirming}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(b.id)}
                    loading={isRejecting}
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
                  {b.booking_date} · {formatTime(b.start_time)}
                </p>
                <div className="mt-1">
                  <BookingStatusBadge status={b.status} />
                </div>
                {b.status === "fully_paid" && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleComplete(b.id)}
                      loading={isCompleting}
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
    </div>
  );
}
