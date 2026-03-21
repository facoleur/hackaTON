"use client";

import { useUIStore } from "@/stores/useUIStore";
import { useEffect } from "react";

export function HideTabbar() {
  const setTabbarHidden = useUIStore((s) => s.setTabbarHidden);
  useEffect(() => {
    setTabbarHidden(true);
    return () => setTabbarHidden(false);
  }, [setTabbarHidden]);
  return null;
}
