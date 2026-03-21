'use client';

import { hapticFeedback } from '@tma.js/sdk-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, readonly, size = 28 }: StarRatingProps) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => {
            if (readonly || !onChange) return;
            try { hapticFeedback.impactOccurred('light'); } catch {}
            onChange(star);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: readonly ? 'default' : 'pointer',
            padding: 0,
            fontSize: size,
            lineHeight: 1,
            color: star <= value ? 'var(--tg-theme-button-color, #2481cc)' : 'var(--tg-theme-hint-color, #999)',
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
