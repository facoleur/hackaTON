"use client";

import { useProfileForm } from "@/app/therapist/hooks/useProfileForm";
import { FormField, FormSection } from "@/components/Form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
        <FormField label="Upfront % (10–100)" error={errors.upfront_percent}>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="100"
            {...register("upfront_percent")}
          />
        </FormField>
      </FormSection>

      <FormSection title="Visibility">
        <label className="flex cursor-pointer items-center justify-between py-1 font-medium">
          <span className="text-foreground text-sm">
            Active (visible to clients)
          </span>
          <Switch
            checked={watch("is_active")}
            onCheckedChange={(val) => setValue("is_active", val)}
          />
        </label>
      </FormSection>

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
