"use client";

import { BookingDrawer } from "@/components/BookingDrawer";
import { HideTabbar } from "@/components/HideTabbar";
import { ImageSlider } from "@/components/ImageSlider";
import { Button } from "@/components/ui/button";
import { useAvailability } from "@/hooks/useAvailability";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useTherapist } from "@/hooks/useTherapists";
import { DAY_NAMES, formatTime } from "@/lib/date";
import { formatTon } from "@/lib/ton";
import { useAuthStore } from "@/stores/useAuthStore";
import { hapticFeedback } from "@tma.js/sdk-react";
import { use, useState } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function TherapistDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: therapist, isLoading } = useTherapist(id);
  const { data: slots = [] } = useAvailability(id);

  const token = useAuthStore((s) => s.supabaseToken);
  const swipeBack = useSwipeBack();

  const [drawerOpen, setDrawerOpen] = useState(false);

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

  return (
    <>
      <HideTabbar />

      <div className="pb-safe-bottom" {...swipeBack}>
        <ImageSlider
          photos={photos}
          alt={therapist.display_name}
          fallback={
            <span className="text-muted-foreground/20 text-8xl font-bold">
              {therapist.display_name.charAt(0)}
            </span>
          }
        >
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

        <div className="space-y-8 pt-5">
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

          {slots.length > 0 && (
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

      {token && (
        <div className="safe-botton-zone fixed right-4 bottom-4 z-30">
          <Button
            size="lg"
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

      <BookingDrawer
        therapist={therapist}
        slots={slots}
        walletAddress={therapist.wallet_address}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
