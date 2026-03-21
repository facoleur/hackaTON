"use client";

import type { TherapistProfile } from "@/lib/types";
import { create } from "zustand";

interface ProfileState {
  profile: TherapistProfile | null;
  setProfile: (profile: TherapistProfile | null) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
