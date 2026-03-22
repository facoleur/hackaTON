import { Skeleton } from "@/components/ui/skeleton";

export function TherapistCardSkeleton() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
      <Skeleton className="absolute inset-0 rounded-2xl" />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 space-y-1.5">
        <Skeleton className="h-5 w-3/4 bg-white/20" />
        <Skeleton className="h-3.5 w-1/2 bg-white/15" />
      </div>
    </div>
  );
}
