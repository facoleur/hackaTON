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
      const supabase = getSupabaseClient(token);

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({ ...bookingInput, client_id: userId, status: "pending" })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const isFullPayment = bookingInput.upfront_percent === 100;
      const { error: payError } = await supabase
        .from("bookings")
        .update({
          status: isFullPayment ? "fully_paid" : "upfront_paid",
          tx_hash_upfront: txHash,
        })
        .eq("id", (booking as Booking).id);

      if (payError) throw payError;

      return booking as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}
