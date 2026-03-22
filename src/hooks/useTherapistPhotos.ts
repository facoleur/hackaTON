'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMyProfile } from '@/hooks/useProfile';
import { queryKeys } from '@/lib/query-keys';

const BUCKET = 'canettes';

function randomId() {
  return Math.random().toString(36).slice(2, 8);
}

/** Extracts the storage path from a Supabase public URL */
function storagePath(publicUrl: string): string {
  const marker = `/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  return idx !== -1 ? publicUrl.slice(idx + marker.length) : publicUrl;
}

export function useTherapistPhotos() {
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUser(userId ?? '') });
    queryClient.invalidateQueries({ queryKey: queryKeys.therapists.all() });
  }

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const supabase = getSupabaseClient(token);
      const urls: string[] = [];

      for (const file of files) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${userId}/${Date.now()}-${randomId()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        urls.push(data.publicUrl);
      }

      const current = profile?.photos ?? [];
      const { error } = await supabase
        .from('therapist_profiles')
        .update({ photos: [...current, ...urls] })
        .eq('user_id', userId);

      if (error) throw error;
      return urls;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (url: string) => {
      const supabase = getSupabaseClient(token);

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath(url)]);

      if (storageError) throw storageError;

      const remaining = (profile?.photos ?? []).filter((p) => p !== url);
      const { error } = await supabase
        .from('therapist_profiles')
        .update({ photos: remaining })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    photos: profile?.photos ?? [],
    isProfileReady: profile != null,
    upload,
    remove,
  };
}
