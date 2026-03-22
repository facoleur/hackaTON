'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { queryKeys } from '@/lib/query-keys';

function notifyPayment(token: string | null, bookingId: string, event: 'upfront' | 'final') {
  fetch('/api/notifications/payment-confirmed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId, event }),
  }).catch(console.error);
}

export function usePay() {
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
        .update({
          status: 'fully_paid',
          tx_hash: txHash,
        })
        .eq('id', bookingId);

      if (error) throw error;
      notifyPayment(token, bookingId, 'final');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}

export function useRateSession() {
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
