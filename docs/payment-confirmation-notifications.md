# Payment Confirmation Notifications

## Goal

When a payment is made (upfront or final), both the **client** and the **therapist** receive a Telegram message confirming the transaction.

---

## Trigger Points

There are two payment events to handle:

| Event | Hook | Status after |
|---|---|---|
| Upfront payment | `usePayUpfront` | `upfront_paid` or `fully_paid` |
| Final payment | `usePayFinal` | `fully_paid` |

Both currently update the `bookings` table directly from the client side via Supabase. Notifications need to fire server-side so they have access to bot tokens and both users' Telegram IDs.

---

## Architecture

### Option A — API route called from the client hook (recommended)

After the Supabase update succeeds in `usePayUpfront` / `usePayFinal`, the hook calls a new Next.js API route:

```
POST /api/notifications/payment-confirmed
Body: { bookingId, event: "upfront" | "final" }
```

The route:
1. Fetches the booking (with joined `users` for client and `therapist_profiles` + therapist `users` for therapist)
2. Sends a Telegram message to the **client** via `TELEGRAM_BOT_TOKEN_CLIENT`
3. Sends a Telegram message to the **therapist** via `TELEGRAM_BOT_TOKEN_THERAPIST`

### Option B — Supabase database webhook / trigger

A Postgres trigger or Supabase Edge Function fires on `UPDATE` to `bookings` when `status` changes to `upfront_paid` or `fully_paid`. Avoids client-side coupling but adds infra complexity. Not recommended for a hackathon timeline.

---

## Implementation Plan

### Step 1 — Add `sendTelegramMessage` to `src/lib/telegram.ts`

```ts
export async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string
): Promise<void>
```

Uses the Telegram Bot API: `POST https://api.telegram.org/bot{token}/sendMessage`

### Step 2 — Create `src/app/api/notifications/payment-confirmed/route.ts`

```
POST /api/notifications/payment-confirmed
Headers: Authorization: Bearer <supabaseToken>  (reuse existing JWT auth)
Body: { bookingId: string, event: "upfront" | "final" }
```

Logic:
1. Validate the JWT (reuse the existing auth middleware pattern from `/api/auth`)
2. Fetch the booking with:
   - `client_id` → join `users` for client `telegram_id` and `first_name`
   - `therapist_id` → join `therapist_profiles` → join `users` for therapist `telegram_id` and `first_name`
3. Build message strings (see **Message Templates** below)
4. Call `sendTelegramMessage` twice: once with `TELEGRAM_BOT_TOKEN_CLIENT`, once with `TELEGRAM_BOT_TOKEN_THERAPIST`
5. Return `{ ok: true }` — errors are logged but must not block the client

### Step 3 — Call the route from `usePayUpfront` and `usePayFinal`

In both hooks, after the Supabase update succeeds, fire a `fetch` to the new route:

```ts
// inside mutationFn, after the supabase update
await fetch('/api/notifications/payment-confirmed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ bookingId, event: isFullPayment ? 'final' : 'upfront' }),
}).catch(console.error); // non-blocking — don't throw
```

---

## Message Templates

### Client message (upfront payment)

```
✅ Payment confirmed!

You paid {upfront_amount} TON upfront for your session with {therapist_display_name}.

📅 {booking_date} at {start_time}
🔗 TX: {tx_hash_upfront}
```

### Client message (final / full payment)

```
✅ Payment complete!

You've fully paid {amount_ton} TON for your session with {therapist_display_name}.

📅 {booking_date} at {start_time}
🔗 TX: {tx_hash_final}
```

### Therapist message (upfront payment received)

```
💰 Upfront payment received!

{client_first_name} paid {upfront_amount} TON for their session with you.

📅 {booking_date} at {start_time}
🔗 TX: {tx_hash_upfront}
```

### Therapist message (final payment received)

```
💰 Final payment received!

{client_first_name} has fully paid {amount_ton} TON. Session is complete.

📅 {booking_date} at {start_time}
🔗 TX: {tx_hash_final}
```

---

## Data to Fetch in the API Route

The booking query must join:

```sql
bookings
  .client_id → users (telegram_id, first_name)
  .therapist_id → therapist_profiles (display_name, user_id)
    .user_id → users (telegram_id)
```

Supabase query:

```ts
const { data } = await supabase
  .from('bookings')
  .select(`
    *,
    client:users!client_id (telegram_id, first_name),
    therapist_profiles (
      display_name,
      therapist_user:users!user_id (telegram_id)
    )
  `)
  .eq('id', bookingId)
  .single();
```

---

## Environment Variables Required

Already present:
- `TELEGRAM_BOT_TOKEN_CLIENT`
- `TELEGRAM_BOT_TOKEN_THERAPIST`

No new env vars needed.

---

## Error Handling

- Notification failures must **never** break the payment flow — catch and log only
- The API route should return 200 even if a Telegram send fails (log the error server-side)
- If the booking is not found or the user has no `telegram_id`, skip silently

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/lib/telegram.ts` | Add `sendTelegramMessage()` |
| `src/app/api/notifications/payment-confirmed/route.ts` | Create new API route |
| `src/hooks/usePayments.ts` | Call the route after successful payment mutations |
