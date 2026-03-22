# End-to-End Flow Analysis: Therapist Onboarding → Booking → Payment

Technical brainstorm of what needs to work and where the gaps are for the full flow:
new therapist connects → creates profile → client books them → therapist sees booking → client pays → therapist gets paid.

---

## 1. Connect as a brand new therapist

**What needs to happen:**
- User opens Telegram Mini App → auth route validates `initData`, upserts user into `users` table
- User needs `role = 'therapist'` to be routed to the therapist shell

**Gap:** The auth route upserts the user but it's unclear how role is assigned. If all new users default to `'client'`, a new therapist would never see the therapist UI. You need either:
- A role-selection screen on first login
- A separate bot entry point that sets `role = 'therapist'` in the upsert
- Or a URL param / env flag that sets role during the auth upsert

---

## 2. Create profile (onboarding)

**What needs to happen:**
- `TherapistShell` detects `profile === null` → renders `OnboardingFlow`
- Steps: wallet connect → basic info → photos → profile is created with `is_active = true`

**Gaps:**
- **`is_active` flag**: After onboarding completes, is it set to `true`? If not, the therapist is invisible to clients. Check the `useUpsertProfile()` call at the end of onboarding.
- **Wallet address**: `WalletSync` component (in `providers.tsx`) updates `users.wallet_address` when a wallet connects. This must fire correctly during the wallet step — otherwise payments to this therapist will fail later (null address).
- **Photo bucket inconsistency**: `OnboardingFlow` uploads to `"therapist-photos"` bucket, but `useTherapistPhotos` hook uses `"canettes"`. If the profile page or client detail view uses the hook to display photos, they'll 404.

---

## 3. User books the therapist

**What needs to happen:**
- Client browses therapists (filtered by `is_active = true`)
- Navigates to therapist detail, sees availability slots
- Opens `BookingDrawer`, picks date/time, sends TON upfront payment
- `useBookAndPay()` creates the booking record with `status = 'pending'`

**Gaps:**
- **Availability slots must exist first**: `useAvailability(therapistId)` feeds the time picker. If the therapist never set up their availability (separate page, not part of onboarding), the client sees no slots to book — the booking UI is unusable. Availability setup must happen before the therapist goes live.
- **`therapist_id` foreign key**: Bookings use `therapist_profiles.id` (not `users.id`). The `useTherapist(id)` hook must correctly fetch both the profile and `users.wallet_address` so the payment has a valid destination address.
- **Atomicity**: Payment happens on-chain first, then `supabase.from('bookings').insert(...)` is called. If the DB write fails after payment, the client is charged with no booking created. No retry or recovery mechanism exists.

---

## 4. Therapist sees the booking

**What needs to happen:**
- `useTherapistDashboard()` fetches `useMyProfile()` to get the `therapist_profiles.id`, then calls `useTherapistBookings(therapistProfileId)`
- New booking appears in "Pending" section
- Therapist can confirm or reject

**Gaps:**
- **Therapist profile ID linkage**: `useMyProfile()` queries by `user_id`. Must return the correct profile that was created in step 2. If profile creation failed silently, this returns null and no bookings are fetched.
- **No real-time or push notifications**: Therapist has to manually refresh to see new bookings. Not a blocker but relevant for UX.
- **Status transition validation is client-side only**: A therapist could technically mark a `pending` booking as `completed` without confirming first. No server guard.

---

## 5. User pays, therapist gets paid

**What needs to happen:**
- Therapist confirms booking → `status = 'confirmed'`
- Client sees pay page `/client/pay/[bookingId]`, pays upfront → `status = 'upfront_paid'` or `'fully_paid'`
- If partial upfront: therapist marks session complete → client rates + pays final → `status = 'fully_paid'`
- TON transfer goes directly to therapist's wallet (no escrow, no platform cut)

**Gaps:**
- **Therapist wallet address at pay time**: `usePayments.ts` needs to resolve the therapist's wallet address. It likely queries `bookings` joined with `therapist_profiles` and then `users`. If the join/select is wrong or wallet is null, `PayButton` has no address to send to and will fail.
- **No on-chain verification**: Transaction BOC hash is stored in `tx_hash_upfront`/`tx_hash_final` but never verified against the TON chain. A client could submit a fake/failed tx and the booking status would still update.
- **No escrow**: Payment goes directly to therapist wallet before the session happens. If therapist cancels after receiving upfront, there's no refund mechanism.
- **Rating blocks final payment**: `useRateAndPayFinal()` ties rating submission to the final payment trigger. If client refuses to rate, they're blocked from paying (and therapist doesn't get final payment).

---

## Minimum required changes to make the flow work end-to-end

| Step | Required Fix |
|------|-------------|
| Auth | Ensure new therapist gets `role = 'therapist'` on signup |
| Onboarding | Ensure `is_active = true` is set when profile is created |
| Onboarding | Fix photo bucket: pick one (`"therapist-photos"`) and use it everywhere |
| Pre-booking | Add availability setup as a required step in onboarding (or block booking if slots = 0) |
| Payment | Verify `users.wallet_address` is saved during wallet connect step in onboarding |
| Payment | Verify the bookings query correctly joins therapist wallet address for `PayButton` |
| Dashboard | Confirm `useMyProfile()` → `useTherapistBookings(profileId)` chain works with correct IDs |

---

## What's already solid

- TON Connect integration (wallet connection, transaction building, nanoton conversion)
- Booking status state machine (`pending` → `confirmed` → `upfront_paid` → `completed` → `fully_paid`)
- Therapist dashboard segmentation (pending / active / history)
- Upfront + final payment split logic
- Auth via Telegram `initData` with JWT issuance
