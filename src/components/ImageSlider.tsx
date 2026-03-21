"use client";

import { useImageSlider } from "@/hooks/useImageSlider";

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
  const { emblaRef, index, scrollTo } = useImageSlider();

  if (photos.length === 0) {
    return (
      <div
        className="relative w-full select-none bg-muted flex items-center justify-center"
        style={{ height }}
      >
        {fallback}
        {children}
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height }} ref={emblaRef}>
      <div className="flex h-full">
        {photos.map((src, idx) => (
          <div key={idx} className="relative shrink-0 w-full h-full">
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute top-4 right-0 left-0 z-20 flex justify-center gap-1.5">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
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
