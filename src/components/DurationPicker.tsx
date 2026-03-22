"use client";

import { cn } from "@/lib/utils";

interface Props {
  base: number;       // therapist.duration_minutes
  max: number;        // therapist.max_multiplier
  value: number;      // current multiplier
  onChange: (multiplier: number) => void;
}

export function DurationPicker({ base, max, value, onChange }: Props) {
  const options = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div>
      <label className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider">
        Duration
      </label>
      <div className="flex gap-2">
        {options.map((m) => {
          const minutes = base * m;
          const label = minutes >= 60 && minutes % 60 === 0
            ? `${minutes / 60}h`
            : `${minutes}min`;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className={cn(
                "flex-1 rounded-xl border py-2 text-sm font-medium transition-colors",
                value === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:border-primary/50"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
