"use client";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/date";
import type { Availability } from "@/lib/types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Props {
  slots: Availability[];
  isDeleting: boolean;
  onDelete: (id: string) => void;
}

export function AvailabilitySlotList({ slots, isDeleting, onDelete }: Props) {
  const byDay = DAY_NAMES.map((name, day) => ({
    day,
    name,
    slots: slots.filter((s) => s.day_of_week === day),
  })).filter((d) => d.slots.length > 0);

  if (byDay.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-foreground font-medium">No slots set</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Add your weekly availability above.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-1">
      {byDay.map(({ day, name, slots: daySlots }) => (
        <div key={day} className="bg-background rounded-xl px-2 py-2">
          <div>
            {daySlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between border-b border-slate-300 last:border-0"
              >
                <div className="flex flex-row gap-3">
                  <span>{name.at(0)}</span>
                  <span className="text-foreground text-sm">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(slot.id)}
                  loading={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
