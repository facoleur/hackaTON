import type { Availability } from "@/lib/types";

export const DAY_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m}${suffix}`;
}

/** Formats "YYYY-MM-DD" → "Sat, Mar 22" (local timezone safe) */
export function formatBookingDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    // weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export interface DatedSlot {
  slot: Availability;
  date: string; // YYYY-MM-DD
  label: string; // "Mon, Mar 23 · 10am – 11am"
}

/** Adds minutes to a "HH:MM" string, returns "HH:MM" */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Expands recurring weekly availability into concrete dated entries
 * for the next 30 days, excluding already-booked date+time combos.
 *
 * @param bookedSet      - Set of "YYYY-MM-DD|HH:MM" strings for active bookings
 * @param durationMinutes - Booking duration; slots shorter than this are excluded
 */
export function expandSlots(
  slots: Availability[],
  bookedSet: Set<string> = new Set(),
  durationMinutes?: number,
): DatedSlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 30);

  const result: DatedSlot[] = [];

  for (const slot of slots) {
    // Skip slot if it's too short for the requested duration
    if (durationMinutes !== undefined) {
      const [sh, sm] = slot.start_time.split(":").map(Number);
      const [eh, em] = slot.end_time.split(":").map(Number);
      const windowMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (durationMinutes > windowMinutes) continue;
    }

    const effectiveEnd = durationMinutes !== undefined
      ? addMinutes(slot.start_time, durationMinutes)
      : slot.end_time;

    const d = new Date(today);
    const diff = (slot.day_of_week - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);

    while (d <= cutoff) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (!bookedSet.has(`${dateStr}|${slot.start_time}`)) {
        const dateLabel = d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        result.push({
          slot,
          date: dateStr,
          label: `${dateLabel} · ${formatTime(slot.start_time)} – ${formatTime(effectiveEnd)}`,
        });
      }

      d.setDate(d.getDate() + 7);
    }
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}
