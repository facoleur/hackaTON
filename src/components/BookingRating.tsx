"use client";

import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";

interface Props {
  rating: number;
  isCancelling: boolean;
  onCancel: () => void;
}

export function BookingRating({ rating, isCancelling, onCancel }: Props) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
        Your rating
      </p>
      <div className="bg-card mx-4 overflow-hidden rounded-xl px-4 py-3 flex items-center justify-between">
        <StarRating value={rating} readonly size={24} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          loading={isCancelling}
          disabled={isCancelling}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
