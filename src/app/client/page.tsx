"use client";

import { TherapistCard } from "@/components/TherapistCard";
import { useTherapists } from "@/hooks/useTherapists";
import { useRouter } from "next/navigation";

export default function BrowsePage() {
  const router = useRouter();
  const { data: therapists, isLoading, error } = useTherapists();

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-foreground font-medium">Failed to load</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Could not load therapists. Please try again.
        </p>
      </div>
    );
  }

  if (!therapists?.length) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-foreground font-medium">No therapists yet</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Check back soon for available massage therapists.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-3 py-4">
      {therapists.map((t) => (
        <TherapistCard
          key={t.id}
          therapist={t}
          onClick={() => router.push(`/client/therapist/${t.id}`)}
        />
      ))}
    </div>
  );
}
