# Remove Split Payment — Always Pay 100% Upfront

## Goal

Eliminate the concept of a configurable upfront percentage. Payment is always 100% of the session price, made at booking time. No more split flows, no final payment, no remaining amount.

---

## New Booking Status Flow

```
pending → confirmed → fully_paid → completed
                   ↘ rejected
         ↘ cancelled
```

- `upfront_paid` status is **removed** (migrate existing rows to `fully_paid`)
- `completed` is kept — therapist still marks when the session was delivered
- Rating happens after `completed` (no payment gate)

---

## Database Changes

### SQL migrations (run in order)

```sql
-- 1. Migrate any bookings stuck in upfront_paid → fully_paid
UPDATE bookings SET status = 'fully_paid' WHERE status = 'upfront_paid';

-- 2. Remove split-payment columns from bookings
ALTER TABLE bookings DROP COLUMN IF EXISTS upfront_percent;
ALTER TABLE bookings DROP COLUMN IF EXISTS upfront_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS remaining_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS tx_hash_final;

-- 3. Rename tx_hash_upfront → tx_hash
ALTER TABLE bookings RENAME COLUMN tx_hash_upfront TO tx_hash;

-- 4. Remove upfront_percent from therapist_profiles
ALTER TABLE therapist_profiles DROP COLUMN IF EXISTS upfront_percent;

-- 5. If BookingStatus is a Postgres enum, remove the 'upfront_paid' value.
--    Postgres does not support DROP VALUE on enums before v14, and even then
--    it's not straightforward. Safest approach: if status is an enum type,
--    recreate it without 'upfront_paid'. If it is a plain varchar/text with a
--    check constraint, drop and re-add the constraint:
--
--    Option A — varchar with CHECK constraint:
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending','confirmed','fully_paid','completed','rejected','cancelled'));
--
--    Option B — enum type (replace with actual type name if different):
-- ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'placeholder'; -- noop, just for syntax
-- (full enum recreation required — create new type, alter column, drop old type)
```

---

## Code Changes

### 1. `src/lib/types.ts`

- **Remove** `upfront_paid` from `BookingStatus`
- **Remove** from `TherapistProfile`: `upfront_percent`
- **Remove** from `Booking`: `upfront_percent`, `upfront_amount`, `remaining_amount`, `tx_hash_upfront`, `tx_hash_final`
- **Add** to `Booking`: `tx_hash: string | null`
- **Remove** from `CreateBookingInput`: `upfront_percent`, `upfront_amount`, `remaining_amount`

---

### 2. `src/hooks/usePayments.ts`

- **Delete** `usePayUpfront` — replace with a single `usePay` that always sets `status: 'fully_paid'` and `tx_hash`
- **Delete** `usePayFinal` — no longer needed
- **Rename** `useRateAndPayFinal` → `useRateSession` — remove any payment logic, only update `rating`
- Keep `useCancelRating` as-is

New `usePay` signature:
```ts
usePay(): mutation({ bookingId: string, txHash: string })
// sets status = 'fully_paid', tx_hash = txHash
```

---

### 3. `src/hooks/useBookAndPay.ts`

- Remove `upfront_percent`, `upfront_amount`, `remaining_amount` from input type
- Remove `isFullPayment` logic — always set `status: 'fully_paid'`
- Always set `tx_hash` (renamed from `tx_hash_upfront`)
- Simplify mutation to just: create booking → update to `fully_paid` + `tx_hash`

---

### 4. `src/components/BookingDrawer.tsx`

- Remove `upfrontAmount` and `remainingAmount` calculations
- Pass `amountTon={totalPrice}` (full amount) to `PayButton`
- Remove `upfront_percent`, `upfront_amount`, `remaining_amount` from `mutateAsync` call
- Update button label to `Pay ${formatTon(totalPrice)}`

---

### 5. `src/app/client/pay/[bookingId]/page.tsx`

- Remove the upfront payment section (was shown when `status === "confirmed"`)
- Remove the final payment section entirely
- Remove `usePayFinal`, `usePayUpfront` imports — replace with `usePay`
- The pay page now only needs: booking info + `PayButton` if `status === "confirmed"` + rating form if `status === "completed"` + "all done" if `status === "fully_paid"` or `"completed"`
- Remove `isFullPayment` logic

---

### 6. `src/components/BookingInfoCard.tsx`

- Remove the upfront/remaining breakdown block (the conditional on `upfront_percent < 100`)
- Only show total amount

---

### 7. `src/components/TransactionHashesCard.tsx`

- Update props: remove `upfrontHash` / `finalHash`, replace with single `txHash: string | null`
- Remove "Upfront TX" / "Final TX" labels — just show "TX" or "Transaction"

---

### 8. `src/components/BookingSuccessCard.tsx`

- Minor: ensure it no longer references `upfrontAmount` — just show total amount paid

---

### 9. `src/components/BookingStatusBadge.tsx`

- Remove `upfront_paid` from the label map
- Remove `.status-badge-upfront_paid` CSS from `globals.css`

---

### 10. `src/app/therapist/profile/page.tsx`

- Remove the "Upfront % (10–100)" input field entirely

---

### 11. `src/app/therapist/hooks/useProfileForm.ts`

- Remove `upfront_percent` from form values type and initial state
- Remove validation/clamping for upfront_percent
- Remove it from the Supabase update payload

---

### 12. `src/app/therapist/page.tsx`

- Update "Active Sessions" filter: `["confirmed", "fully_paid"]` (was `["confirmed", "upfront_paid"]`)
- Update "Mark Complete" button: show when `status === "fully_paid"` (was `status === "upfront_paid"`)

---

### 13. `src/app/therapist/hooks/useTherapistDashboard.ts`

- Change `"upfront_paid"` → `"fully_paid"` in active statuses array

---

### 14. `src/app/client/therapist/[id]/page.tsx`

- Remove `upfrontAmount` / `remainingAmount` calculations
- Remove "Pay now" / "Pay after session" split display
- Show only: "Session price: X TON"

---

### 15. `src/hooks/useTherapistBookedDates.ts`

- Remove `"upfront_paid"` from `ACTIVE_STATUSES` (it'll no longer exist)
- Array becomes: `["pending", "confirmed", "fully_paid", "completed"]`

---

### 16. `src/scripts/seed-therapists.ts`

- Remove `upfront_percent` from all seed therapist objects

---

### 17. `src/app/_assets/globals.css`

- Delete `.status-badge-upfront_paid` block

---

## Files Summary

| File | Action |
|---|---|
| `src/lib/types.ts` | Remove upfront fields, rename tx_hash_upfront → tx_hash |
| `src/hooks/usePayments.ts` | Delete usePayUpfront + usePayFinal, add usePay, rename useRateAndPayFinal |
| `src/hooks/useBookAndPay.ts` | Remove split payment input fields |
| `src/components/BookingDrawer.tsx` | Simplify to full payment |
| `src/app/client/pay/[bookingId]/page.tsx` | Remove split payment UI sections |
| `src/components/BookingInfoCard.tsx` | Remove upfront breakdown |
| `src/components/TransactionHashesCard.tsx` | Single tx_hash prop |
| `src/components/BookingSuccessCard.tsx` | Remove upfrontAmount ref |
| `src/components/BookingStatusBadge.tsx` | Remove upfront_paid label + CSS |
| `src/app/therapist/profile/page.tsx` | Remove upfront % field |
| `src/app/therapist/hooks/useProfileForm.ts` | Remove upfront_percent |
| `src/app/therapist/page.tsx` | Update active status filter |
| `src/app/therapist/hooks/useTherapistDashboard.ts` | Update status arrays |
| `src/app/client/therapist/[id]/page.tsx` | Simplify pricing display |
| `src/hooks/useTherapistBookedDates.ts` | Update ACTIVE_STATUSES |
| `src/scripts/seed-therapists.ts` | Remove upfront_percent from seed data |
| `src/app/_assets/globals.css` | Remove upfront_paid badge CSS |
