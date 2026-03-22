"use client";

import { queryKeys } from "@/lib/query-keys";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { Booking, CreateBookingInput } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BookAndPayInput extends CreateBookingInput {
  txHash: string;
}

export function useBookAndPay() {
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ txHash, ...bookingInput }: BookAndPayInput) => {
      console.log("[useBookAndPay] starting", { txHash, bookingInput, token: !!token, userId });

      const supabase = getSupabaseClient(token);

      console.log("[useBookAndPay] inserting booking...");
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({ ...bookingInput, client_id: userId, status: "pending" })
        .select()
        .single();

      console.log("[useBookAndPay] insert result", { booking, bookingError });
      if (bookingError) throw bookingError;

      const isFullPayment = bookingInput.upfront_percent === 100;
      console.log("[useBookAndPay] updating payment status", { bookingId: (booking as Booking).id, isFullPayment, txHash });

      const { error: payError } = await supabase
        .from("bookings")
        .update({
          status: isFullPayment ? "fully_paid" : "upfront_paid",
          tx_hash_upfront: txHash,
        })
        .eq("id", (booking as Booking).id);

      console.log("[useBookAndPay] update result", { payError });
      if (payError) throw payError;

      console.log("[useBookAndPay] done ✓");
      return booking as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
    onError: (err) => {
      console.error("[useBookAndPay] mutation error", err);
    },
  });
}
