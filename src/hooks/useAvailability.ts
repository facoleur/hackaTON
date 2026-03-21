'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { queryKeys } from '@/lib/query-keys';
import type { Availability } from '@/lib/types';

export function useAvailability(therapistProfileId: string) {
  const token = useAuthStore((s) => s.supabaseToken);

  return useQuery({
    queryKey: queryKeys.availability.byTherapist(therapistProfileId),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('therapist_id', therapistProfileId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data as Availability[];
    },
    enabled: !!token && !!therapistProfileId,
  });
}

export function useAddAvailability(therapistProfileId: string) {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slot: Pick<Availability, 'day_of_week' | 'start_time' | 'end_time'>) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from('availability')
        .insert({ ...slot, therapist_id: therapistProfileId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.byTherapist(therapistProfileId),
      });
    },
  });
}

export function useDeleteAvailability(therapistProfileId: string) {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.byTherapist(therapistProfileId),
      });
    },
  });
}
