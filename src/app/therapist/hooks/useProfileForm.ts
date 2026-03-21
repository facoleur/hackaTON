"use client";

import { useMyProfile, useUpsertProfile } from "@/hooks/useProfile";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export interface ProfileFormValues {
  display_name: string;
  bio: string;
  price_ton: string;
  duration_minutes: string;
  upfront_percent: string;
  location_name: string;
  is_active: boolean;
}

export function useProfileForm() {
  const { data: profile, isLoading } = useMyProfile();
  const upsert = useUpsertProfile();
  const setProfile = useProfileStore((s) => s.setProfile);

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      display_name: "",
      bio: "",
      price_ton: "",
      duration_minutes: "60",
      upfront_percent: "100",
      location_name: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (!profile) return;
    setProfile(profile);
    form.reset({
      display_name: profile.display_name ?? "",
      bio: profile.bio ?? "",
      price_ton: String(profile.price_ton ?? ""),
      duration_minutes: String(profile.duration_minutes ?? 60),
      upfront_percent: String(profile.upfront_percent ?? 100),
      location_name: profile.location_name ?? "",
      is_active: profile.is_active ?? true,
    });
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: ProfileFormValues) {
    try { hapticFeedback.impactOccurred("medium"); } catch {}
    await upsert.mutateAsync({
      display_name: values.display_name,
      bio: values.bio || null,
      price_ton: parseFloat(values.price_ton),
      duration_minutes: parseInt(values.duration_minutes),
      upfront_percent: Math.min(100, Math.max(10, parseInt(values.upfront_percent))),
      location_name: values.location_name || null,
      is_active: values.is_active,
    });
    try { hapticFeedback.notificationOccurred("success"); } catch {}
  }

  return { form, profile, isLoading, upsert, onSubmit };
}
