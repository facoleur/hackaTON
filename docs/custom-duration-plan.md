# Custom Duration Booking — Implementation Plan

## Mental model

`therapist_profiles.duration_minutes` = **base unit** (e.g. 60 min = 1 TON).
The client picks a **multiplier** (1×, 2×, 3×…) at booking time.
`booking.duration_minutes = base × multiplier`
`booking.amount_ton = price_ton × multiplier`
`booking.upfront_amount = amount_ton × upfront_percent / 100`
`booking.remaining_amount = amount_ton - upfront_amount`

All derived values are computed client-side before inserting the booking row — no new DB columns for derived fields.

---

## Database changes

### 1. Add `max_multiplier` to `therapist_profiles`

Therapists cap how many units a client can buy in one booking (default 3).

```sql
ALTER TABLE therapist_profiles
  ADD COLUMN max_multiplier integer NOT NULL DEFAULT 3
  CONSTRAINT max_multiplier_min CHECK (max_multiplier >= 1);
```

### 2. No other schema changes

`bookings.duration_minutes` and `bookings.amount_ton` already store actual values — they just need correct inputs. Nothing else changes.

---

## Availability slot filtering

**Current:** `expandSlots` labels each slot as `9am – 5pm` (full window). A slot is excluded only if its `start_time` is already booked.

**With duration:** A slot is only valid for a given duration if the window is long enough to fit it:

```
slot_window_minutes = end_time_minutes - start_time_minutes
valid = duration_minutes <= slot_window_minutes
```

`expandSlots` must accept `durationMinutes` and:
1. Skip slots where the window is shorter than the chosen duration
2. Update the label to show the **actual end time** (`start_time + duration`) instead of the availability window end

---

## File structure

```
src/
  lib/
    date.ts                     ← update expandSlots signature + label
    types.ts                    ← add max_multiplier to TherapistProfile

  components/
    DurationPicker.tsx          ← new: multiplier pill selector
    BookingDrawer.tsx           ← add DurationPicker, derive amounts from multiplier

  app/
    therapist/
      hooks/
        useProfileForm.ts       ← add max_multiplier field
      profile/
        page.tsx                ← add max_multiplier input
```

No new hooks. No new pages.

---

## Component responsibilities (SoC)

| Layer | Responsibility |
|-------|---------------|
| `DurationPicker` | Renders multiplier pills (1×, 2×, … max_multiplier×). Emits selected multiplier. Knows nothing about prices. |
| `BookingDrawer` | Owns state: `multiplier`. Derives `duration`, `totalPrice`, `upfrontAmount`, `remainingAmount` from `multiplier + therapist`. Passes derived values down. |
| `expandSlots` (lib) | Pure function. Accepts `durationMinutes`. Filters and labels slots. No side effects. |
| `useBookAndPay` | Unchanged. Already accepts dynamic `duration_minutes` and `amount_ton`. |

---

## Changes per file

### `src/lib/types.ts`
Add `max_multiplier` to `TherapistProfile`:
```ts
max_multiplier: number; // default 3
```

### `src/lib/date.ts` — `expandSlots`
Change signature:
```ts
// before
expandSlots(slots: Availability[], bookedSet?: Set<string>): DatedSlot[]

// after
expandSlots(slots: Availability[], bookedSet?: Set<string>, durationMinutes?: number): DatedSlot[]
```

Inside the loop:
- Skip slot if `durationMinutes > slot_window_minutes`
- Compute `endTime = addMinutes(slot.start_time, durationMinutes)` for the label
- Label: `"Mon, Mar 24 · 9am – 11am"` (reflects actual booking window, not full availability window)

Add pure helper:
```ts
function addMinutes(time: string, minutes: number): string
// "09:00" + 90 → "10:30"
```

### `src/components/DurationPicker.tsx` — new
```tsx
interface Props {
  base: number;         // therapist.duration_minutes
  max: number;          // therapist.max_multiplier
  value: number;        // current multiplier
  onChange: (m: number) => void;
}
```
Renders pills: `60 min`, `120 min`, `180 min`.
No price logic inside — purely presentational.

### `src/components/BookingDrawer.tsx`
- Add `multiplier` state (default `1`)
- Derive amounts:
  ```ts
  const totalPrice = therapist.price_ton * multiplier;
  const duration = therapist.duration_minutes * multiplier;
  const upfrontAmount = (totalPrice * therapist.upfront_percent) / 100;
  const remainingAmount = totalPrice - upfrontAmount;
  ```
- Pass `multiplier` and `duration` to `expandSlots` so slots filter correctly
- Render `<DurationPicker>` between slot list and pay button
- Pass derived values to `bookAndPay.mutateAsync` and `PayButton`

### `src/app/therapist/hooks/useProfileForm.ts`
Add `max_multiplier` to form values and submit payload.

### `src/app/therapist/profile/page.tsx`
Add a `FormField` for `max_multiplier` (numeric input, 1–10) under Pricing & Duration.

---

## What does NOT change

- `useBookAndPay` — already dynamic, no changes
- `CreateBookingInput` type — already has `duration_minutes` and `amount_ton`
- `BookingInfoCard`, `BookingCard` — already display `duration_minutes` from the booking row
- Payment hooks (`usePayUpfront`, `usePayFinal`) — use `booking.upfront_amount` / `booking.remaining_amount`, already correct
- `TherapistDashboard` — displays `b.duration_minutes` from DB, already correct

---

## Telegram

No changes required. There are currently no outbound bot messages on booking events. If Telegram notifications are added later, include `duration_minutes` in the message payload — it's already on the booking row.

---

## Execution order

| # | Task | Files |
|---|------|-------|
| 1 | Run SQL migration | Supabase |
| 2 | Add `max_multiplier` to `TherapistProfile` type | `types.ts` |
| 3 | Add `addMinutes` helper + update `expandSlots` signature | `date.ts` |
| 4 | Build `DurationPicker` component | `DurationPicker.tsx` |
| 5 | Wire `multiplier` state into `BookingDrawer` | `BookingDrawer.tsx` |
| 6 | Add `max_multiplier` to therapist profile form | `useProfileForm.ts`, `profile/page.tsx` |
