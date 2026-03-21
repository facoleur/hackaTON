# Therapist Photo Upload

Photos are stored in **Supabase Storage** (public bucket) and their URLs are saved in the `photos` column (`string[]`) of `therapist_profiles`.

---

## 1. Supabase Setup

Create a **public** bucket called `therapist-photos` in your Supabase dashboard (Storage → New bucket → enable "Public bucket").

Add an RLS policy so authenticated users can upload to their own folder:

```sql
-- Allow upload to own folder: therapist-photos/<user_id>/*
create policy "therapist upload own photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'therapist-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow delete of own photos
create policy "therapist delete own photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'therapist-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 2. Hook: `usePhotos`

A single hook handles upload, remove, and persisting the `photos` array. It reuses the existing `getSupabaseClient` and `useUpsertProfile`.

```ts
// src/hooks/usePhotos.ts
'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUpsertProfile } from '@/hooks/useProfile';

export function usePhotos(currentPhotos: string[] = []) {
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);
  const upsert = useUpsertProfile();
  const [uploading, setUploading] = useState(false);

  async function addPhoto(file: File) {
    const supabase = getSupabaseClient(token);
    const path = `${userId}/${Date.now()}_${file.name}`;

    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from('therapist-photos')
        .upload(path, file, { upsert: false });
      if (error) throw error;

      const { data } = supabase.storage
        .from('therapist-photos')
        .getPublicUrl(path);

      await upsert.mutateAsync({ photos: [...currentPhotos, data.publicUrl] });
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(url: string) {
    const supabase = getSupabaseClient(token);
    // Extract the storage path from the public URL
    const path = url.split('/therapist-photos/')[1];

    await supabase.storage.from('therapist-photos').remove([path]);
    await upsert.mutateAsync({
      photos: currentPhotos.filter((p) => p !== url),
    });
  }

  return { addPhoto, removePhoto, uploading };
}
```

---

## 3. Component: `PhotoManager`

Drop this into the profile page. It shows current photos and lets the therapist add/remove them.

```tsx
// src/components/PhotoManager.tsx
'use client';

import { usePhotos } from '@/hooks/usePhotos';

interface Props {
  photos: string[];
}

export function PhotoManager({ photos }: Props) {
  const { addPhoto, removePhoto, uploading } = usePhotos(photos);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <div key={url} className="relative w-24 h-24">
            <img src={url} className="w-full h-full object-cover rounded-lg" />
            <button
              onClick={() => removePhoto(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <label className="block cursor-pointer text-sm text-blue-500">
        {uploading ? 'Uploading…' : '+ Add photo'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addPhoto(file);
            e.target.value = ''; // reset so same file can be re-selected
          }}
        />
      </label>
    </div>
  );
}
```

---

## 4. Usage in Profile Page

```tsx
// Inside src/app/therapist/profile/page.tsx
import { PhotoManager } from '@/components/PhotoManager';

// Inside the form JSX, after loading profile:
<FormSection title="Photos">
  <PhotoManager photos={profile?.photos ?? []} />
</FormSection>
```

`PhotoManager` manages its own mutations — no changes needed to `useProfileForm` or `useUpsertProfile`.

---

## Summary

| What | Where |
|------|-------|
| Storage bucket | Supabase dashboard → `therapist-photos` (public) |
| Upload + DB sync | `src/hooks/usePhotos.ts` |
| UI | `src/components/PhotoManager.tsx` |
| Integration | Profile page, pass `profile?.photos ?? []` |

No new API routes. No new state management. Reuses existing `getSupabaseClient` and `useUpsertProfile`.
