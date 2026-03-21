"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMyProfile, useUpsertProfile } from "@/hooks/useProfile";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const upsert = useUpsertProfile();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [priceTon, setPriceTon] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [upfrontPercent, setUpfrontPercent] = useState("100");
  const [locationName, setLocationName] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setPriceTon(String(profile.price_ton ?? ""));
      setDurationMinutes(String(profile.duration_minutes ?? 60));
      setUpfrontPercent(String(profile.upfront_percent ?? 100));
      setLocationName(profile.location_name ?? "");
      setIsActive(profile.is_active ?? true);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleSave() {
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
    await upsert.mutateAsync({
      display_name: displayName,
      bio: bio || null,
      price_ton: parseFloat(priceTon) || 0,
      duration_minutes: parseInt(durationMinutes) || 60,
      upfront_percent: Math.min(
        100,
        Math.max(10, parseInt(upfrontPercent) || 100)
      ),
      location_name: locationName || null,
      is_active: isActive,
    });
    try {
      hapticFeedback.notificationOccurred("success");
    } catch {}
  }

  return (
    <div className="space-y-4 py-4">
      {/* Basic Info */}
      <div>
        <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
          Basic Info
        </p>
        <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Display name
            </label>
            <Input
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Bio
            </label>
            <Textarea
              placeholder="Tell clients about yourself and your services..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Location
            </label>
            <Input
              placeholder="City, neighborhood..."
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pricing & Duration */}
      <div>
        <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
          Pricing &amp; Duration
        </p>
        <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Price (TON)
            </label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 2.5"
              value={priceTon}
              onChange={(e) => setPriceTon(e.target.value)}
            />
          </div>
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Duration (minutes)
            </label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="60"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Upfront % (10–100)
            </label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="100"
              value={upfrontPercent}
              onChange={(e) => setUpfrontPercent(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div>
        <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
          Visibility
        </p>
        <div className="bg-card rounded-xl mx-4">
          <label className="flex items-center justify-between px-4 py-3 cursor-pointer">
            <span className="text-sm text-foreground">
              Active (visible to clients)
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 pb-4">
        <Button
          size="lg"
          className="w-full"
          loading={upsert.isPending}
          disabled={!displayName || !priceTon || upsert.isPending}
          onClick={handleSave}
        >
          {profile ? "Save Changes" : "Create Profile"}
        </Button>
      </div>
    </div>
  );
}
