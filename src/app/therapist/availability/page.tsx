"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    profile?.id ?? ""
  );
  const addSlot = useAddAvailability(profile?.id ?? "");
  const deleteSlot = useDeleteAvailability(profile?.id ?? "");

  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  if (profileLoading || slotsLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="font-medium text-foreground">Profile required</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your profile first before setting availability.
        </p>
      </div>
    );
  }

  async function handleAdd() {
    try {
      hapticFeedback.impactOccurred("light");
    } catch {}
    await addSlot.mutateAsync({
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
    });
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

  const byDay = DAY_NAMES.map((name, day) => ({
    day,
    name,
    slots: slots?.filter((s) => s.day_of_week === day) ?? [],
  })).filter((d) => d.slots.length > 0);

  return (
    <div className="space-y-4 py-4">
      {/* Add Time Slot */}
      <div>
        <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
          Add Time Slot
        </p>
        <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
          <div className="px-4 py-3">
            <div className="flex gap-2 flex-wrap">
              {DAY_NAMES.map((name, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[13px] cursor-pointer min-w-[44px] min-h-[44px] border transition-colors",
                    selectedDay === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-primary border-primary hover:bg-primary/10"
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Start time
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              End time
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="px-4 pt-3 pb-4">
            <Button
              size="lg"
              className="w-full"
              loading={addSlot.isPending}
              disabled={addSlot.isPending}
              onClick={handleAdd}
            >
              Add Slot
            </Button>
          </div>
        </div>
      </div>

      {/* Existing slots by day */}
      {byDay.length > 0 ? (
        byDay.map(({ day, name, slots: daySlots }) => (
          <div key={day}>
            <p className="px-4 text-xs font-medium text-muted-foreground   tracking-wide mb-1">
              {name}
            </p>
            <div className="bg-card rounded-xl overflow-hidden divide-y divide-border mx-4">
              {daySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-foreground">
                    {slot.start_time} – {slot.end_time}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(slot.id)}
                    loading={deleteSlot.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-8 text-center">
          <p className="font-medium text-foreground">No slots set</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your weekly availability above.
          </p>
        </div>
      )}
    </div>
  );
}
