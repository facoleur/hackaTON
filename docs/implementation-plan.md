# Implementation Plan: Full Therapist → Booking → Payment Flow

Ordered by priority. Items 1–5 are **blockers** (flow breaks without them). Items 6–8 are **correctness fixes** (flow works but data is wrong or fragile).

---

## 1. Fix `is_active` not set during onboarding — BLOCKER

**Problem:** `InfoStep.onSubmit()` calls `useUpsertProfile()` without `is_active: true`. The `useTherapists()` query on the client side filters `.eq('is_active', true)`. A freshly-onboarded therapist has `is_active = null` (or DB default) and is **invisible to every client**.

**File:** `src/app/therapist/onboarding/OnboardingFlow.tsx` — `InfoStep`, `onSubmit()`

**Change:** Add `is_active: true` to the upsert payload:

```ts
await upsert.mutateAsync({
  display_name: values.display_name,
  age: ...,
  bio: ...,
  location_name: ...,
  price_ton: ...,
  photos: [],
  is_active: true,   // ← add this
});
```

---

## 2. Fix photo storage bucket inconsistency — BLOCKER

**Problem:** Two different buckets are used for the same photos:
- `OnboardingFlow.tsx` → uploads to `"therapist-photos"`
- `useTherapistPhotos.ts` → uploads/removes from `"canettes"`

The profile page and `TherapistPhotoManager` use the hook. If a therapist uploads photos during onboarding and then tries to manage them via the profile page, the hook looks in the wrong bucket — deletes fail, new uploads go to the wrong place.

**Decision:** Standardize on `"canettes"` (the bucket used by `useTherapistPhotos` and all post-onboarding photo management).

**File:** `src/app/therapist/onboarding/OnboardingFlow.tsx` ✅ done

**Change:** Replace `"therapist-photos"` with `"canettes"` in both the `upload` and `getPublicUrl` calls in `PhotosStep.handleFinish()`.

---

## 3. Add availability setup path — BLOCKER

**Problem:** The booking UI in `BookingDrawer` is fed by `useAvailability(therapistId)`. If the therapist has no availability slots, the time picker is empty and clients can't book. Availability setup is a separate page (`/therapist/availability`) that is **never surfaced during or after onboarding**.

**Two changes needed:**

### 3a. Add redirect after onboarding completes

**File:** `src/app/therapist/TherapistShell.tsx` — `OnboardingGate`

After `onDone` is called, redirect to `/therapist/availability` instead of just setting `onboardingDone = true`:

```ts
import { useRouter } from 'next/navigation';

function OnboardingGate({ children }: PropsWithChildren) {
  const router = useRouter();
  // ...
  if (!onboardingDone && profile === null) {
    return (
      <OnboardingFlow
        onDone={() => {
          setOnboardingDone(true);
          router.push('/therapist/availability');
        }}
      />
    );
  }
  // ...
}
```

### 3b. Add a dashboard banner when availability is empty

**File:** `src/app/therapist/page.tsx` (TherapistDashboard)

Pull `useAvailability(profile?.id)` and show a CTA card if `slots.length === 0`:

```tsx
{profile && slots.length === 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mx-2 mt-3">
    <p className="text-sm font-medium text-yellow-800">Set your availability</p>
    <p className="text-xs text-yellow-700 mt-1">
      Clients can't book you until you add schedule slots.
    </p>
    <button onClick={() => router.push('/therapist/availability')} ...>
      Add availability →
    </button>
  </div>
)}
```

---

## 4. Verify wallet address is saved before clients can pay — VERIFY & FIX IF NEEDED

**Problem:** `WalletSync` in `providers.tsx` fires `supabase.from('users').update({ wallet_address })` whenever the wallet changes. The wallet connect step in onboarding is step 1. But there's a race: the user connects wallet → `WalletSync` fires the DB update async → user rapidly fills in info and photos → profile is created. If a client immediately tries to book and pay, `useBooking(bookingId)` fetches `.select("*, therapist_profiles(*, users(wallet_address))")` and may get `null`.

**Check:** In `WalletSync`, the `useEffect` fires on `[address, token, userId]`. Auth (`token`) is set by `AuthInit` which fires once on mount. The wallet connect fires after that. So the order is:
1. Auth completes → `token` is set
2. Therapist connects wallet → `address` is set → `WalletSync` fires DB update
3. Therapist fills info form → `useUpsertProfile()` creates the profile row

This means the wallet is saved **before** the profile is created — the timing is fine for this case.

**Action:** No code change needed. But verify the Supabase RLS policy on `users` allows `UPDATE` for the authenticated user on their own row. If this policy is missing, `WalletSync` silently fails (it only logs, doesn't throw).

---

## 5. Verify the `therapist_profiles → users` join for wallet at pay time — VERIFY

**Problem:** `useBooking(bookingId)` fetches:
```ts
.select("*, therapist_profiles(*, users(wallet_address))")
```
This PostgREST nested select requires a **foreign key** from `therapist_profiles.user_id` → `users.id` to be declared in the Supabase schema. If it's missing, PostgREST returns `therapist_profiles.users = null` silently, and `therapistWallet` in `pay/[bookingId]/page.tsx` is `null` → `PayButton` has no address → payment fails.

**Action:** In the Supabase dashboard (Table Editor → therapist_profiles → Foreign Keys), confirm:
- `therapist_profiles.user_id` → `users.id` FK exists

If missing, add it via migration:
```sql
ALTER TABLE therapist_profiles
  ADD CONSTRAINT therapist_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id);
```

After confirming the FK exists, also check `pay/[bookingId]/page.tsx` line 55:
```ts
const therapistWallet = booking.therapist_profiles.wallet_address;
```
This value comes from the flattened join in `useBookings.ts` lines 64–79. The logic is correct as long as the FK exists.

---

## 6. Decouple rating from final payment gate — UX FIX

**Problem:** In `pay/[bookingId]/page.tsx`, the final payment section is gated on `hasRating`:
```ts
{booking.status === 'completed' && hasRating && booking.upfront_percent < 100 && (
  <PayButton ... />
)}
```
If the client refuses to rate, they're permanently blocked from completing the payment, and the therapist never gets paid. `useRateAndPayFinal` also conflates rating submission with the payment trigger.

**Fix:** Show the final `PayButton` regardless of rating. Keep the rating form as a soft prompt ("Rate your session before paying"), but don't gate the button on it.

**File:** `src/app/client/pay/[bookingId]/page.tsx`

Change the condition:
```ts
// Before
{booking.status === 'completed' && hasRating && booking.upfront_percent < 100 && ...}

// After
{booking.status === 'completed' && booking.upfront_percent < 100 && ...}
```

And in `usePayments.ts`, split `useRateAndPayFinal` into two separate mutations: `useRateSession` (saves rating only) and keep `usePayFinal` as is.

---

## 7. Fix `onboardingDone` state not syncing with profile refetch — EDGE CASE

**Problem:** `OnboardingGate` uses local state `onboardingDone` to skip the gate after onboarding. But if the page is refreshed, `onboardingDone` resets to `false` and the component re-checks `profile`. Since `useUpsertProfile` invalidates the profile query on success, `profile` should now be non-null — so the gate passes correctly. However, if the invalidation races with the `onDone()` call (profile query hasn't refetched yet), the gate briefly re-renders the onboarding flow.

**Fix:** In `TherapistShell.tsx`, don't rely on `onboardingDone` at all — let the gate rely solely on `profile !== null`:

```ts
// Remove onboardingDone state entirely
// Change the condition to:
if (profile === null) {
  return <OnboardingFlow onDone={() => {}} />;
}
```

Since `useUpsertProfile` invalidates the cache on success, `profile` will be non-null shortly after `onDone()` is called and the gate will naturally re-render to show children.

---

## 8. Add `is_active` update to profile edit page — CONSISTENCY

**File:** `src/app/therapist/profile/page.tsx` (or `useProfileForm.ts`)

Ensure the profile edit form preserves `is_active: true` when saving (it shouldn't overwrite it to `false`). Since `useUpsertProfile` does a `upsert` on `user_id`, any field not passed will be left unchanged by Supabase. **Verify** the profile form doesn't accidentally pass `is_active: false` or omit it in a way that triggers a reset.

---

## Execution Order

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Add `is_active: true` to onboarding upsert | `OnboardingFlow.tsx` | ✅ done |
| 2 | Fix photo bucket to `"canettes"` | `OnboardingFlow.tsx` | ✅ done |
| 3a | Redirect to availability after onboarding | `TherapistShell.tsx` | ✅ done |
| 3b | Dashboard banner when no availability slots | `therapist/page.tsx` | ✅ done |
| 4 | Verify RLS policy on `users.wallet_address` | Supabase dashboard | ⚠️ manual check |
| 5 | Verify/add FK `therapist_profiles.user_id → users.id` | Supabase dashboard / migration | ⚠️ manual check |
| 6 | Decouple rating from final payment gate | `pay/[bookingId]/page.tsx` | ✅ done |
| 7 | Remove `onboardingDone` state from gate | `TherapistShell.tsx` | ✅ done |
| 8 | Audit profile edit for `is_active` preservation | `useProfileForm.ts` | ✅ already correct |
