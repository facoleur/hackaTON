"use client";

import { queryKeys } from "@/lib/query-keys";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQuery } from "@tanstack/react-query";

function useTherapistWalletAddress(therapistProfileId: string) {
  const token = useAuthStore((s) => s.supabaseToken);

  return useQuery({
    queryKey: queryKeys.therapists.walletAddress(therapistProfileId),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from("therapist_profiles")
        .select("users(wallet_address)")
        .eq("id", therapistProfileId)
        .single();

      if (error) throw error;
      const users = data?.users as unknown as {
        wallet_address: string | null;
      }[];
      return users?.[0]?.wallet_address ?? null;
    },
    enabled: !!token && !!therapistProfileId,
  });
}

export { useTherapistWalletAddress };
