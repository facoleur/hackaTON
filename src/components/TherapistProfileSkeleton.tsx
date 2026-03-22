import { Skeleton } from "@/components/ui/skeleton";

export function TherapistProfileSkeleton() {
  return (
    <div>
      {/* Image area */}
      <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
        <Skeleton className="absolute inset-0" />
        {/* Overlay text placeholders */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 space-y-2">
          <Skeleton className="h-7 w-2/5 bg-white/20" />
          <Skeleton className="h-4 w-1/4 bg-white/15" />
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-8 pt-5">
        {/* Bio */}
        <div className="px-4 space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        {/* Pricing */}
        <div className="px-4 space-y-2">
          <Skeleton className="h-3 w-14" />
          <div className="rounded-2xl overflow-hidden space-y-px">
            <Skeleton className="h-11 w-full rounded-none" />
            <Skeleton className="h-11 w-full rounded-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
