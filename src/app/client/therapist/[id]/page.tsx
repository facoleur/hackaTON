"use client";

import { HideTabbar } from "@/components/HideTabbar";
import { ImageSlider } from "@/components/ImageSlider";
import { Button } from "@/components/ui/button";
import { useAvailability } from "@/hooks/useAvailability";
import { useCreateBooking } from "@/hooks/useBookings";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useTherapist } from "@/hooks/useTherapists";
import { formatTon } from "@/lib/ton";
import { useAuthStore } from "@/stores/useAuthStore";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m}${suffix}`;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function TherapistDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: therapist, isLoading } = useTherapist(id);
  const { data: slots } = useAvailability(id);
  const createBooking = useCreateBooking();
  const token = useAuthStore((s) => s.supabaseToken);

  const swipeBack = useSwipeBack();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-foreground font-medium">Not found</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Therapist not found.
        </p>
      </div>
    );
  }

  const photos = therapist.photos?.length ? therapist.photos : [];
  const upfrontAmount = (therapist.price_ton * therapist.upfront_percent) / 100;
  const remainingAmount = therapist.price_ton - upfrontAmount;

  const selectedSlot = slots?.find((s) => s.id === selectedSlotId) ?? null;

  async function handleConfirm() {
    if (!selectedSlot || !bookingDate || !therapist) return;
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
    await createBooking.mutateAsync({
      therapist_id: therapist.id,
      booking_date: bookingDate,
      start_time: selectedSlot.start_time,
      duration_minutes: therapist.duration_minutes,
      amount_ton: therapist.price_ton,
      upfront_percent: therapist.upfront_percent,
      upfront_amount: upfrontAmount,
      remaining_amount: remainingAmount,
    });
    try {
      hapticFeedback.notificationOccurred("success");
    } catch {}
    router.push("/client/bookings");
  }

  const canConfirm =
    !!selectedSlot && !!bookingDate && !createBooking.isPending;

  return (
    <>
      <HideTabbar />
      {/* Scrollable page */}
      <div className="pb-safe-bottom" {...swipeBack}>
        {/* Hero — 70vh swipeable photo */}
        <ImageSlider
          photos={photos}
          alt={therapist.display_name}
          fallback={
            <span className="text-muted-foreground/20 text-8xl font-bold">
              {therapist.display_name.charAt(0)}
            </span>
          }
        >
          {/* Bottom gradient with identity info */}
          <div
            className="absolute inset-x-0 bottom-0 px-5 pt-20 pb-5"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
            }}
          >
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl leading-tight font-bold text-white">
                {therapist.display_name}
              </h1>
            </div>
            {therapist.rating != null && (
              <div className="mt-1 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-sm font-medium text-white/90">
                  {therapist.rating.toFixed(1)}
                </span>
              </div>
            )}
            {therapist.location_name && (
              <div className="mt-0.5 flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm text-white/65">
                  {therapist.location_name}
                </span>
              </div>
            )}
          </div>
        </ImageSlider>

        {/* Content */}
        <div className="space-y-8 pt-5">
          {/* Bio */}
          {therapist.bio && (
            <div className="px-4">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider">
                About
              </p>
              <p className="text-foreground text-sm leading-relaxed">
                {therapist.bio}
              </p>
            </div>
          )}

          {/* Pricing */}
          <div className="px-4">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider">
              Pricing
            </p>
            <div className="bg-card divide-border divide-y overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-foreground text-sm">Session price</span>
                <span className="text-foreground text-sm font-medium">
                  {formatTon(therapist.price_ton)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-foreground text-sm">Duration</span>
                <span className="text-foreground text-sm font-medium">
                  {therapist.duration_minutes} min
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-foreground text-sm">Pay now</span>
                <span className="text-primary text-sm font-semibold">
                  {formatTon(upfrontAmount)}
                </span>
              </div>
              {therapist.upfront_percent < 100 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-foreground text-sm">
                    Pay after session
                  </span>
                  <span className="text-foreground text-sm font-medium">
                    {formatTon(remainingAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          {slots && slots.length > 0 && (
            <div className="px-4">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider">
                Availability
              </p>
              <div className="bg-background flex flex-row gap-1 overflow-x-auto rounded-2xl pb-1">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex shrink-0 flex-col items-center px-1 py-2"
                  >
                    <span className="text-foreground text-base leading-none font-semibold">
                      {DAY_NAMES[slot.day_of_week]}
                    </span>
                    <span className="text-muted-foreground mt-1.5 text-xs">
                      {formatTime(slot.start_time)}-{formatTime(slot.end_time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!token && (
            <p className="text-muted-foreground px-8 text-center text-sm">
              Sign in via Telegram to book a session.
            </p>
          )}
        </div>
      </div>

      {/* Fixed Book button — sits above bottom nav (nav is ~56px) */}
      {token && (
        <div className="safe-botton-zone fixed right-4 bottom-4 z-30">
          <Button
            size="lg"
            className="h-12 w-full rounded-2xl px-6 text-base font-semibold shadow-lg"
            onClick={() => {
              try {
                hapticFeedback.impactOccurred("light");
              } catch {}
              setDrawerOpen(true);
            }}
          >
            Book a session
          </Button>
        </div>
      )}

      {/* Bottom drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet */}
          <div className="bg-background fixed right-0 bottom-0 left-0 z-50 rounded-t-3xl px-4 pt-3 pb-12! shadow-2xl">
            {/* Handle */}
            <div className="bg-border mx-auto mb-5 h-1 w-10 rounded-full" />

            <h2 className="text-foreground mb-5 text-lg font-semibold">
              Book a session
            </h2>

            {/* Date */}
            <div className="mb-4">
              <label className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border-border bg-card text-foreground focus:ring-primary/40 w-full appearance-none rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            {/* Time slot */}
            {slots && slots.length > 0 && (
              <div className="mb-6">
                <label className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider">
                  Time slot
                </label>
                <div className="flex flex-col gap-2">
                  {slots.map((slot) => {
                    const active = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          try {
                            hapticFeedback.impactOccurred("light");
                          } catch {}
                          setSelectedSlotId(slot.id);
                        }}
                        className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors"
                        style={{
                          borderColor: active
                            ? "var(--primary)"
                            : "var(--border)",
                          background: active
                            ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                            : "var(--card)",
                          color: active
                            ? "var(--primary)"
                            : "var(--foreground)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        <span>{DAY_NAMES[slot.day_of_week]}</span>
                        <span>
                          {slot.start_time} – {slot.end_time}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm */}
            <Button
              size="lg"
              className="h-12 w-full rounded-2xl text-base font-semibold"
              disabled={!canConfirm}
              loading={createBooking.isPending}
              onClick={handleConfirm}
            >
              {canConfirm
                ? `Confirm · Pay ${formatTon(upfrontAmount)} now`
                : "Select date & time slot"}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
