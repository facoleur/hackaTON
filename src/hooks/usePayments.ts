'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { queryKeys } from '@/lib/query-keys';

export function usePayUpfront() {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      txHash,
      isFullPayment,
    }: {
      bookingId: string;
      txHash: string;
      isFullPayment: boolean;
    }) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from('bookings')
        .update({
          status: isFullPayment ? 'fully_paid' : 'upfront_paid',
          tx_hash_upfront: txHash,
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}

export function useRateAndPayFinal() {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      rating,
    }: {
      bookingId: string;
      rating: number;
    }) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from('bookings')
        .update({ rating, review: null })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}

export function useCancelRating() {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from('bookings')
        .update({ rating: null, review: null })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}

export function usePayFinal() {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      txHash,
    }: {
      bookingId: string;
      txHash: string;
    }) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'fully_paid', tx_hash_final: txHash })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}
