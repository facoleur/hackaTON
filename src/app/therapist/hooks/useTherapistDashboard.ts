"use client";

import {
  useCompleteBooking,
  useConfirmBooking,
  useRejectBooking,
  useTherapistBookings,
} from "@/hooks/useBookings";
import { useMyProfile } from "@/hooks/useProfile";
import { hapticFeedback } from "@tma.js/sdk-react";

export function useTherapistDashboard() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: bookings, isLoading: bookingsLoading } = useTherapistBookings(
    profile?.id ?? "",
  );
  const confirm = useConfirmBooking();
  const reject = useRejectBooking();
  const complete = useCompleteBooking();

  const isLoading = profileLoading || bookingsLoading;

  const pending = bookings?.filter((b) => b.status === "pending") ?? [];
  const active =
    bookings?.filter((b) =>
      ["confirmed", "fully_paid"].includes(b.status),
    ) ?? [];
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

  return {
    profile,
    isLoading,
    bookings,
    pending,
    active,
    history,
    handleConfirm,
    handleReject,
    handleComplete,
    isConfirming: confirm.isPending,
    isRejecting: reject.isPending,
    isCompleting: complete.isPending,
  };
}
