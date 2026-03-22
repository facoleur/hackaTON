"use client";

import { useProfileForm } from "@/app/therapist/hooks/useProfileForm";
import { FormField, FormSection } from "@/components/Form";
import { TherapistPhotoManager } from "@/components/TherapistPhotoManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/useAuthStore";
import { Address } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";

function Spinner() {
  return (
    <div className="flex justify-center p-10">
      <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  );
}

// ─── Custom hook ──────────────────────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { form, profile, isLoading, upsert, onSubmit } = useProfileForm();
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const [tonConnectUI] = useTonConnectUI();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = form;

  if (isLoading) return <Spinner />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <FormSection title="Basic Info">
        <FormField label="Display name" error={errors.display_name}>
          <Input placeholder="Your name" {...register("display_name")} />
        </FormField>
        <FormField label="Bio">
          <Input
            placeholder="Tell clients about yourself and your services..."
            {...register("bio")}
          />
        </FormField>
        <FormField label="Location">
          <Input
            placeholder="City, neighborhood..."
            {...register("location_name")}
          />
        </FormField>
      </FormSection>

      <FormSection >
        <FormField label="TON address">
          {walletAddress ? (
            <div className="bg-muted flex items-center justify-between gap-2 rounded-lg px-3 py-2">
              <span className="font-mono text-sm font-medium">
                {(() => { const a = Address.parse(walletAddress).toString({ urlSafe: true, bounceable: false }); return `${a.slice(0, 6)}...${a.slice(-6)}`; })()}
              </span>
              <span className="text-muted-foreground text-xs">Connected</span>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => tonConnectUI.openModal()}
            >
              Connect Wallet
            </Button>
          )}
        </FormField>
      </FormSection>

      <FormSection title="Pricing & Duration">
        <FormField label="Price (TON)" error={errors.price_ton}>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 2.5"
            {...register("price_ton")}
          />
        </FormField>
        <FormField label="Duration (minutes)">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="60"
            {...register("duration_minutes")}
          />
        </FormField>
        <FormField label="Max sessions">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="3"
            {...register("max_multiplier")}
          />
        </FormField>
        <FormField label="Upfront % (10–100)" error={errors.upfront_percent}>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="100"
            {...register("upfront_percent")}
          />
        </FormField>
      </FormSection>

      <FormSection >
        <div className="flex items-center justify-between py-1">
          <span className="text-foreground text-sm font-medium">
            Active (visible to clients)
          </span>
          <Switch
            checked={watch("is_active")}
            onCheckedChange={(val) => setValue("is_active", val)}
          />
        </div>
      </FormSection>

      <TherapistPhotoManager />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={upsert.isPending}
        disabled={!isValid || upsert.isPending}
      >
        {profile ? "Save Changes" : "Create Profile"}
      </Button>
    </form>
  );
}
