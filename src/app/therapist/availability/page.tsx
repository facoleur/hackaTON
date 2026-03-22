"use client";

import { AvailabilitySlotList } from "@/components/AvailabilitySlotList";
import { FormField, FormSection } from "@/components/Form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useAddAvailability,
  useAvailability,
  useDeleteAvailability,
} from "@/hooks/useAvailability";
import { useMyProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useState } from "react";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AvailabilityPage() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: slots, isLoading: slotsLoading } = useAvailability(
    profile?.id ?? "",
  );
  const addSlot = useAddAvailability(profile?.id ?? "");
  const deleteSlot = useDeleteAvailability(profile?.id ?? "");

  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [sameHours, setSameHours] = useState(true);
  const [sharedStart, setSharedStart] = useState("09:00");
  const [sharedEnd, setSharedEnd] = useState("17:00");
  const [perDayTimes, setPerDayTimes] = useState<
    Record<number, { start: string; end: string }>
  >({});

  if (profileLoading || slotsLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-foreground font-medium">Profile required</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Create your profile first before setting availability.
        </p>
      </div>
    );
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
        if (!perDayTimes[day]) {
          setPerDayTimes((t) => ({
            ...t,
            [day]: { start: sharedStart, end: sharedEnd },
          }));
        }
      }
      return next;
    });
  }

  async function handleAdd() {
    if (selectedDays.size === 0) return;
    try {
      hapticFeedback.impactOccurred("light");
    } catch {}

    for (const day of Array.from(selectedDays).sort()) {
      const start = sameHours
        ? sharedStart
        : (perDayTimes[day]?.start ?? sharedStart);
      const end = sameHours ? sharedEnd : (perDayTimes[day]?.end ?? sharedEnd);
      await addSlot.mutateAsync({
        day_of_week: day,
        start_time: start,
        end_time: end,
      });
    }

    setSelectedDays(new Set());
    try {
      hapticFeedback.notificationOccurred("success");
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
    await deleteSlot.mutateAsync(id);
  }

  return (
    <div className="space-y-4 px-1 py-4">
      {/* Day toggles */}
      <FormSection>
        <div className="flex flex-wrap gap-1">
          {DAY_NAMES.map((name, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={cn(
                "border-primary/30! min-h-11 min-w-11 flex-1 cursor-pointer rounded-md border px-2 text-center py-1.5 text-sm",
                selectedDays.has(i)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-primary border-primary hover:bg-primary/10 bg-transparent",
              )}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      </FormSection>

      {/* Hours form */}
      <FormSection>
        <FormField label="Same hours for all days">
          <div className="flex justify-end">
            <Switch checked={sameHours} onCheckedChange={setSameHours} />
          </div>
        </FormField>
      </FormSection>
      <FormSection>
        {sameHours && (
          <>
            <FormField label="Start time">
              <Input
                type="time"
                value={sharedStart}
                onChange={(e) => setSharedStart(e.target.value)}
              />
            </FormField>
            <FormField label="End time">
              <Input
                type="time"
                value={sharedEnd}
                onChange={(e) => setSharedEnd(e.target.value)}
              />
            </FormField>
          </>
        )}

        {!sameHours && selectedDays.size === 0 && (
          <p className="text-muted-foreground py-2 text-center text-sm">
            Select days above to set their hours.
          </p>
        )}

        {!sameHours &&
          Array.from(selectedDays)
            .sort()
            .map((day) => (
              <div key={day}>
                <p className="text-muted-foreground pt-2 pb-1 text-xs font-semibold">
                  {DAY_NAMES[day]}
                </p>
                <div>
                  <FormField label="Start">
                    <Input
                      type="time"
                      value={perDayTimes[day]?.start ?? sharedStart}
                      onChange={(e) =>
                        setPerDayTimes((t) => ({
                          ...t,
                          [day]: { ...t[day], start: e.target.value },
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="End">
                    <Input
                      type="time"
                      value={perDayTimes[day]?.end ?? sharedEnd}
                      onChange={(e) =>
                        setPerDayTimes((t) => ({
                          ...t,
                          [day]: { ...t[day], end: e.target.value },
                        }))
                      }
                    />
                  </FormField>
                </div>
              </div>
            ))}
      </FormSection>

      <Button
        size="lg"
        className="w-full"
        loading={addSlot.isPending}
        disabled={addSlot.isPending || selectedDays.size === 0}
        onClick={handleAdd}
      >
        {selectedDays.size > 1
          ? `Add Slots (${selectedDays.size} days)`
          : "Add Slot"}
      </Button>

      <AvailabilitySlotList
        slots={slots ?? []}
        isDeleting={deleteSlot.isPending}
        onDelete={handleDelete}
      />
    </div>
  );
}
