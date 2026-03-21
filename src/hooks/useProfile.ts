'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { queryKeys } from '@/lib/query-keys';
import type { TherapistProfile } from '@/lib/types';

export function useMyProfile() {
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);

  return useQuery({
    queryKey: queryKeys.profile.byUser(userId ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as TherapistProfile | null;
    },
    enabled: !!token && !!userId,
  });
}

export function useUpsertProfile() {
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      profile: Partial<Omit<TherapistProfile, 'id' | 'user_id' | 'created_at'>>
    ) => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from('therapist_profiles')
        .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data as TherapistProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUser(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.therapists.all() });
    },
  });
}
