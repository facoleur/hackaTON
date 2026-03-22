"use client";

import { useImageSlider } from "@/hooks/useImageSlider";
import type { TherapistProfile } from "@/lib/types";

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
  const { emblaRef, index: currentIndex, scrollTo } = useImageSlider();
  const photos = therapist.photos?.length ? therapist.photos : [];
  const hasMultiple = photos.length > 1;

  function handleDotClick(e: React.MouseEvent, idx: number) {
    e.stopPropagation();
    scrollTo(idx);
  }

  return (
    <div
      className="relative w-full cursor-pointer overflow-hidden rounded-xl select-none"
      style={{ aspectRatio: "3/4" }}
      onClick={onClick}
    >
      {/* Embla viewport */}
      <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
        {photos.length > 0 ? (
          <div className="flex h-full">
            {photos.map((src, idx) => (
              <div key={idx} className="h-full w-full shrink-0">
                <img
                  src={src}
                  alt={therapist.display_name}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <span className="text-muted-foreground/30 text-6xl font-bold">
              {therapist.display_name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {hasMultiple && (
        <div className="absolute top-3 right-0 left-0 z-20 flex justify-center gap-1.5 px-4">
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
        className="absolute inset-x-0 bottom-0 px-4 pt-16 pb-4"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)",
        }}
      >
        {/* Name + age */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl leading-tight font-semibold text-white">
            {therapist.display_name}
          </span>
          {therapist.age != null && (
            <span className="text-lg font-medium text-white/70">
              {therapist.age}
            </span>
          )}
        </div>

        {/* Rating */}
        {therapist.rating != null && (
          <div className="mt-0.5 flex items-center gap-1">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="#ffffff"
              className="text-muted shrink-0 opacity-40"
            >
              <path
                fill="#ffffff"
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            <span className="text-sm font-normal text-white/60">
              {therapist.rating.toFixed(1)}
              {reviewCount != null && (
                <span className="font-normal text-white/60">
                  {" "}
                  · {reviewCount} avis
                </span>
              )}
            </span>
          </div>
        )}

        {/* Location */}
        {therapist.location_name && (
          <div className="mt-0.5 flex items-center gap-1">
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
            <span className="text-xs text-white/65">
              {therapist.location_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
