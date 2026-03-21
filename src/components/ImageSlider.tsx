"use client";

import { useRef, useState } from "react";

interface Props {
  photos: string[];
  alt: string;
  fallback?: React.ReactNode;
  height?: string;
  children?: React.ReactNode;
}

export function ImageSlider({
  photos,
  alt,
  fallback,
  height = "70vh",
  children,
}: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0 && index < photos.length - 1) setIndex((i) => i + 1);
    else if (delta > 0 && index > 0) setIndex((i) => i - 1);
  }

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {photos.length > 0 ? (
        <div
          className="absolute inset-0 flex"
          style={{
            width: `${photos.length * 100}%`,
            transform: `translateX(-${(index / photos.length) * 100}%)`,
            transition: "transform 350ms ease",
          }}
        >
          {photos.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={alt}
              className="h-full object-cover"
              style={{ width: `${100 / photos.length}%` }}
              draggable={false}
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted absolute inset-0 flex items-center justify-center">
          {fallback}
        </div>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute top-4 right-0 left-0 z-20 flex justify-center gap-1.5">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className="h-1 rounded-full transition-all duration-200"
              style={{
                width: idx === index ? "20px" : "6px",
                background:
                  idx === index
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
