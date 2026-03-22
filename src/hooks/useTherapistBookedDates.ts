"use client";

import { queryKeys } from "@/lib/query-keys";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQuery } from "@tanstack/react-query";

/** Statuses that occupy a slot (i.e. not free to rebook) */
const ACTIVE_STATUSES = ["pending", "confirmed", "fully_paid", "completed"];

/**
 * Returns a Set of "YYYY-MM-DD|HH:MM" strings representing slots that are
 * already taken for the given therapist.
 */
export function useTherapistBookedDates(therapistId: string): Set<string> {
  const token = useAuthStore((s) => s.supabaseToken);

  const { data } = useQuery({
    queryKey: queryKeys.bookings.bookedDates(therapistId),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date, start_time")
        .eq("therapist_id", therapistId)
        .in("status", ACTIVE_STATUSES);

      if (error) throw error;
      return data as { booking_date: string; start_time: string }[];
    },
    enabled: !!token && !!therapistId,
  });

  if (!data) return new Set();
  return new Set(data.map((b) => `${b.booking_date}|${b.start_time}`));
}
