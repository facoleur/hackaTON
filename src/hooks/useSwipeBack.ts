"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

/** Returns touch handlers that navigate back when the user swipes right from the left edge. */
export function useSwipeBack(edgeThreshold = 30, minDelta = 60) {
  const router = useRouter();
  const startX = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const x = e.touches[0].clientX;
    startX.current = x < edgeThreshold ? x : null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (delta > minDelta) router.back();
  }

  return { onTouchStart, onTouchEnd };
}
