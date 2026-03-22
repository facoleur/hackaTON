"use client";

import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface Props {
  isPending: boolean;
  onSubmit: (rating: number, review?: string) => void;
}

export function RateSessionForm({ isPending, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  return (
    <div>
      <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
        Rate your session
      </p>
      <div className="bg-card mx-4 space-y-3 overflow-hidden rounded-xl px-4 py-3">
        <div className="flex justify-center py-1">
          <StarRating value={rating} onChange={setRating} />
        </div>
        <Textarea
          placeholder="Optional review..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />
        <Button
          size="lg"
          className="w-full"
          onClick={() => onSubmit(rating, review || undefined)}
          disabled={rating === 0 || isPending}
          loading={isPending}
        >
          Submit Rating
        </Button>
      </div>
    </div>
  );
}
