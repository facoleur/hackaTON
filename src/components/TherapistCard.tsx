"use client";

import type { TherapistProfile } from "@/lib/types";
import { useRef, useState } from "react";

interface TherapistCardProps {
  therapist: TherapistProfile;
  reviewCount?: number;
  onClick?: () => void;
}

export function TherapistCard({
  therapist,
  reviewCount,
  onClick,
}: TherapistCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const photos = therapist.photos?.length ? therapist.photos : [];
  const hasMultiple = photos.length > 1;

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0 && currentIndex < photos.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (delta > 0 && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function handleDotClick(e: React.MouseEvent, idx: number) {
    e.stopPropagation();
    setCurrentIndex(idx);
  }

  const photo = photos[currentIndex];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-lg cursor-pointer select-none"
      style={{ aspectRatio: "3/4" }}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image */}
      {photo ? (
        <img
          src={photo}
          alt={therapist.display_name}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-6xl font-bold text-muted-foreground/30">
            {therapist.display_name.charAt(0)}
          </span>
        </div>
      )}

      {/* Dot indicators */}
      {hasMultiple && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-20 px-4">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => handleDotClick(e, idx)}
              className="h-1 rounded-full transition-all duration-200"
              style={{
                width: idx === currentIndex ? "20px" : "6px",
                background:
                  idx === currentIndex
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.45)",
              }}
              aria-label={`Photo ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div
        className="absolute inset-x-0 bottom-0  px-4 pb-4 pt-16"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)",
        }}
      >
        {/* Name + age */}
        <div className="flex items-baseline gap-2">
          <span
            className="text-white font-bold leading-tight"
            style={{ fontSize: "1.35rem", letterSpacing: "-0.01em" }}
          >
            {therapist.display_name}
          </span>
          {therapist.age != null && (
            <span className="text-white/80 font-medium text-lg">
              {therapist.age}
            </span>
          )}
        </div>

        {/* Rating */}
        {therapist.rating != null && (
          <div className="flex items-center gap-1 mt-0.5">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="#facc15"
              className="shrink-0"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-white/90 text-sm font-medium">
              {therapist.rating.toFixed(1)}
              {reviewCount != null && (
                <span className="text-white/60 font-normal">
                  {" "}
                  · {reviewCount} avis
                </span>
              )}
            </span>
          </div>
        )}

        {/* Location */}
        {therapist.location_name && (
          <div className="flex items-center gap-1 mt-0.5">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-white/65 text-xs">
              {therapist.location_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
