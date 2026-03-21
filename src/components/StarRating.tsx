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
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => {
            if (readonly || !onChange) return;
            try { hapticFeedback.impactOccurred('light'); } catch {}
            onChange(star);
          }}
          className={[
            'bg-transparent border-none p-0 leading-none min-w-[44px] min-h-[44px] flex items-center justify-center',
            readonly ? 'cursor-default' : 'cursor-pointer',
            star <= value
              ? 'text-[color:var(--tg-theme-button-color,#2481cc)]'
              : 'text-[color:var(--tg-theme-hint-color,#999)]',
          ].join(' ')}
          style={{ fontSize: size }}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
