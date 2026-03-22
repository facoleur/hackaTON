"use client";

import { FormField, FormSection } from "@/components/Form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpsertProfile } from "@/hooks/useProfile";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

type Step = "wallet" | "info" | "photos";

interface OnboardingFlowProps {
  onDone: () => void;
}

interface InfoFormValues {
  display_name: string;
  age: string;
  bio: string;
  location_name: string;
  price_ton: string;
}

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const [step, setStep] = useState<Step>(walletAddress ? "info" : "wallet");

  useEffect(() => {
    if (step === "wallet" && walletAddress) {
      setStep("info");
    }
  }, [walletAddress, step]);

  const stepLabel =
    step === "wallet" ? "1 / 3" : step === "info" ? "2 / 3" : "3 / 3";

  return (
    <div className="flex min-h-screen flex-col p-4 pb-8">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-bold">Set up your profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Step {stepLabel}</p>
        <div className="mt-3 flex gap-1.5 justify-center">
          {(["wallet", "info", "photos"] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                s === step
                  ? "bg-primary"
                  : step === "info" && s === "wallet"
                    ? "bg-primary/40"
                    : step === "photos" && s !== "photos"
                      ? "bg-primary/40"
                      : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {step === "wallet" && <WalletStep />}
      {step === "info" && <InfoStep onNext={() => setStep("photos")} />}
      {step === "photos" && <PhotosStep onDone={onDone} />}
    </div>
  );
}

function WalletStep() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="text-6xl">💎</div>
      <div>
        <h2 className="text-lg font-semibold">Connect your TON wallet</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Your wallet is required to receive payments from clients. It will be
          saved securely.
        </p>
      </div>
      {wallet ? (
        <div className="bg-card w-full rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-green-600">Wallet connected!</p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {wallet.account.address.slice(0, 8)}…
            {wallet.account.address.slice(-6)}
          </p>
        </div>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={() => tonConnectUI.openModal()}
        >
          Connect Wallet
        </Button>
      )}
    </div>
  );
}

function InfoStep({ onNext }: { onNext: () => void }) {
  const upsert = useUpsertProfile();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<InfoFormValues>({
    defaultValues: {
      display_name: "",
      age: "",
      bio: "",
      location_name: "",
      price_ton: "0.5",
    },
    mode: "onChange",
  });

  async function onSubmit(values: InfoFormValues) {
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
    await upsert.mutateAsync({
      display_name: values.display_name,
      age: values.age ? parseInt(values.age) : undefined,
      bio: values.bio || null,
      location_name: values.location_name || null,
      price_ton: parseFloat(values.price_ton) || 0.5,
      photos: [],
      is_active: true,
    });
    try {
      hapticFeedback.notificationOccurred("success");
    } catch {}
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormSection title="About You">
        <FormField label="Name *" error={errors.display_name}>
          <Input
            placeholder="e.g. Maria"
            {...register("display_name", { required: "Required" })}
          />
        </FormField>
        <FormField label="Age *" error={errors.age}>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 28"
            {...register("age", {
              required: "Required",
              min: { value: 18, message: "Must be 18+" },
              max: { value: 99, message: "Invalid age" },
            })}
          />
        </FormField>
        <FormField label="Bio">
          <Input
            placeholder="Tell clients about yourself..."
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

      <FormSection title="Pricing">
        <FormField label="Price per session (TON)" error={errors.price_ton}>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0.5"
            step="0.1"
            {...register("price_ton", {
              required: "Required",
              min: { value: 0.01, message: "Must be > 0" },
            })}
          />
        </FormField>
      </FormSection>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={upsert.isPending}
        disabled={!isValid || upsert.isPending}
      >
        Continue
      </Button>
    </form>
  );
}

function PhotosStep({ onDone }: { onDone: () => void }) {
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upsert = useUpsertProfile();
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleFinish() {
    setUploading(true);
    setError(null);
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}

    try {
      const supabase = getSupabaseClient(token);
      const urls: string[] = [];

      for (const { file } of photos) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("canettes")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage
          .from("canettes")
          .getPublicUrl(path);
        urls.push(data.publicUrl);
      }

      await upsert.mutateAsync({ photos: urls });
      try {
        hapticFeedback.notificationOccurred("success");
      } catch {}
      onDone();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Upload failed, try again",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Add your photos</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Add at least one photo so clients can recognise you.
        </p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(({ preview }, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-lg"
            >
              <img
                src={preview}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {photos.length > 0 ? "Add more photos" : "Choose photos"}
      </Button>

      {error && <p className="text-destructive text-center text-sm">{error}</p>}

      {photos.length > 0 ? (
        <Button
          size="lg"
          className="w-full"
          loading={uploading}
          disabled={uploading}
          onClick={handleFinish}
          type="button"
        >
          Finish setup
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={onDone}
          type="button"
        >
          Skip for now
        </Button>
      )}
    </div>
  );
}
