"use client";

import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props {
  isPending: boolean;
  onSubmit: (rating: number) => void;
}

export function RateSessionForm({ isPending, onSubmit }: Props) {
  const [rating, setRating] = useState(0);

  return (
    <div>
      <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
        Rate your session
      </p>
      <div className="bg-card mx-4 overflow-hidden rounded-xl px-4 py-4 space-y-4">
        <div className="flex justify-center">
          <StarRating value={rating} onChange={setRating} />
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => onSubmit(rating)}
          disabled={rating === 0 || isPending}
          loading={isPending}
        >
          Submit Rating
        </Button>
      </div>
    </div>
  );
}
