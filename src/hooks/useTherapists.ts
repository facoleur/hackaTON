'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { queryKeys } from '@/lib/query-keys';
import type { TherapistProfile } from '@/lib/types';

export function useTherapists() {
  const token = useAuthStore((s) => s.supabaseToken);

  return useQuery({
    queryKey: queryKeys.therapists.list(),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data as TherapistProfile[];
    },
    enabled: !!token,
  });
}

export function useTherapist(id: string) {
  const token = useAuthStore((s) => s.supabaseToken);

  return useQuery({
    queryKey: queryKeys.therapists.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as TherapistProfile;
    },
    enabled: !!token && !!id,
  });
}
