import { Skeleton } from "@/components/ui/skeleton";

export function BookingCardSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2 py-0.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}
