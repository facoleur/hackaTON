'use client';

import { useTherapistPhotos } from '@/hooks/useTherapistPhotos';
import { hapticFeedback } from '@tma.js/sdk-react';
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';

export function TherapistPhotoManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { photos, isProfileReady, upload, remove } = useTherapistPhotos();
  const [previews, setPreviews] = useState<string[]>([]);

  function handlePick() {
    try { hapticFeedback.impactOccurred('light'); } catch {}
    inputRef.current?.click();
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';

    const blobUrls = files.map((f) => URL.createObjectURL(f));
    setPreviews(blobUrls);

    try {
      await upload.mutateAsync(files);
    } finally {
      blobUrls.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
    }
  }

  function handleRemove(url: string) {
    try { hapticFeedback.impactOccurred('medium'); } catch {}
    remove.mutate(url);
  }

  return (
    <div>
      <p className="px-4 text-xs font-medium text-muted-foreground tracking-wide mb-2">
        Photos
      </p>

      {!isProfileReady ? (
        <p className="px-4 text-sm text-muted-foreground">
          Save your profile first to manage photos.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 px-4">
          {photos.map((url, i) => (
            <PhotoTile
              key={url}
              url={url}
              index={i}
              isRemoving={remove.isPending && remove.variables === url}
              onRemove={() => handleRemove(url)}
              disabled={remove.isPending}
            />
          ))}

          {/* Uploading previews */}
          {previews.map((url) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <img
                src={url}
                alt="Uploading…"
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <Spinner white />
              </div>
            </div>
          ))}

          {/* Add tile */}
          <button
            type="button"
            onClick={handlePick}
            disabled={upload.isPending || !isProfileReady}
            className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed bg-transparent transition-opacity"
            style={{
              borderColor: 'var(--tg-theme-hint-color, #aaa)',
              opacity: upload.isPending ? 0.5 : 1,
            }}
            aria-label="Add photos"
          >
            {upload.isPending ? (
              <Spinner />
            ) : (
              <>
                <ImagePlus
                  size={22}
                  style={{ color: 'var(--tg-theme-button-color, #2481cc)' }}
                />
                <span
                  className="text-xs"
                  style={{ color: 'var(--tg-theme-hint-color, #999)' }}
                >
                  Add
                </span>
              </>
            )}
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface PhotoTileProps {
  url: string;
  index: number;
  isRemoving: boolean;
  disabled: boolean;
  onRemove: () => void;
}

function PhotoTile({ url, index, isRemoving, disabled, onRemove }: PhotoTileProps) {
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
      <img
        src={url}
        alt={`Photo ${index + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Delete button */}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center border-none p-0"
        style={{ background: 'rgba(0,0,0,0.55)' }}
        aria-label="Remove photo"
      >
        <X size={13} color="white" strokeWidth={2.5} />
      </button>

      {/* Removal overlay */}
      {isRemoving && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <Spinner white />
        </div>
      )}
    </div>
  );
}

function Spinner({ white }: { white?: boolean }) {
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
      style={{
        borderColor: white
          ? 'rgba(255,255,255,0.8)'
          : 'var(--tg-theme-button-color, #2481cc)',
        borderTopColor: 'transparent',
      }}
    />
  );
}
