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
| `src/lib/telegram.ts` | Add `sendTelegramMessage()` and `sendTelegramInlineKeyboard()` |
| `src/app/api/notifications/payment-confirmed/route.ts` | Create new API route |
| `src/hooks/usePayments.ts` | Call the route after successful payment mutations |

---

## Extension A — 24h Session Reminder

### Feasibility: easy

**Vercel plan note:** Hobby plan supports daily crons only (`0 8 * * *` = every day at 8am UTC). This is fine — the query uses `booking_date = tomorrow` which is a full-day match, so the exact hour the cron fires doesn't matter much. Clients get their reminder sometime that morning.

### DB change

```sql
ALTER TABLE bookings ADD COLUMN reminded_24h boolean NOT NULL DEFAULT false;
```

### Trigger

Vercel cron runs **daily at 8am UTC**. Route queries bookings where:
- `status IN ('confirmed', 'fully_paid')`
- `booking_date = CURRENT_DATE + 1` (session is tomorrow)
- `reminded_24h = false`

Marks `reminded_24h = true` after sending.

### `vercel.json`

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }]
}
```

### Message templates

**Client:**
```
⏰ Reminder: session tomorrow

Your session with {therapist_display_name} is tomorrow.
📅 {booking_date} at {start_time} · {duration_minutes} min
```

**Therapist:**
```
⏰ Reminder: session tomorrow

You have a session with {client_first_name} tomorrow.
📅 {booking_date} at {start_time} · {duration_minutes} min
```

### Files

| File | Action |
|---|---|
| `src/app/api/cron/reminders/route.ts` | New cron route |
| `vercel.json` | Add cron schedule |

---

## Extension B — Post-session Review Request (with inline buttons)

### Feasibility: moderate

**Vercel plan note:** Same daily cron handles this. The query checks `booking_date = CURRENT_DATE - 1` (session was yesterday). Review requests go out the morning after the session — clean, no time arithmetic needed.

Scheduling is trivial (same daily cron). Rating buttons require Telegram **callback queries** and a registered webhook on the client bot.

### How Telegram inline buttons work

1. Bot sends a message with an `InlineKeyboardMarkup` — buttons embedded in the message
2. User taps a button → Telegram POSTs a `callback_query` to your registered webhook URL
3. Your webhook route handles it: reads `callback_data` (encodes `bookingId:rating`), updates the DB, calls `answerCallbackQuery` to dismiss the spinner
4. Only the **client bot** needs a webhook (only clients rate sessions)

### Register the webhook (one-time, after deploy)

```bash
curl -X POST "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN_CLIENT}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook", "allowed_updates": ["callback_query"]}'
```

### DB change

```sql
ALTER TABLE bookings ADD COLUMN review_requested boolean NOT NULL DEFAULT false;
```

### Trigger

Same daily cron. Additional query: bookings where:
- `status IN ('fully_paid', 'completed')`
- `booking_date = CURRENT_DATE - 1` (session was yesterday)
- `review_requested = false`

### `sendTelegramInlineKeyboard` (new function in `telegram.ts`)

```ts
export async function sendTelegramInlineKeyboard(
  botToken: string,
  chatId: number,
  text: string,
  buttons: { text: string; callback_data: string }[]
): Promise<void>
// Calls POST /sendMessage with reply_markup.inline_keyboard
```

### Review request message (client only)

```
⭐ How was your session?

Rate your session with {therapist_display_name}:
```

Inline keyboard row:
```
[ 1 ★ ]  [ 2 ★ ]  [ 3 ★ ]  [ 4 ★ ]  [ 5 ★ ]
```

`callback_data` per button: `"rate:{bookingId}:{rating}"` (e.g. `"rate:abc-123:4"`)

### Webhook handler (`/api/telegram/webhook`)

```
POST /api/telegram/webhook
Body: Telegram Update object (no auth — Telegram sends this directly)
```

Logic:
1. Check `update.callback_query` exists
2. Parse `callback_data`: split on `:` → `[action, bookingId, rating]`
3. If `action === 'rate'`: update `bookings.rating = rating` where `id = bookingId`
4. Call `answerCallbackQuery` with the callback query id (required to dismiss button spinner)
5. Edit the original message to confirm: `"✅ Thanks for your rating!"`

### Files

| File | Action |
|---|---|
| `src/app/api/cron/reminders/route.ts` | Add review request logic alongside 24h reminder |
| `src/app/api/telegram/webhook/route.ts` | New — handles callback_query from inline buttons |
| `src/lib/telegram.ts` | Add `sendTelegramInlineKeyboard()` and `answerCallbackQuery()` |

---

## Full Files Summary

| File | Action |
|---|---|
| `src/lib/telegram.ts` | Add `sendTelegramMessage()`, `sendTelegramInlineKeyboard()`, `answerCallbackQuery()` |
| `src/app/api/notifications/payment-confirmed/route.ts` | New — payment confirmation |
| `src/app/api/cron/reminders/route.ts` | New — daily reminder + review request (runs at 8am UTC) |
| `src/app/api/telegram/webhook/route.ts` | New — callback_query handler for star ratings |
| `src/hooks/usePayments.ts` | Call payment-confirmed route after mutations |
| `vercel.json` | Add daily cron `0 8 * * *` |

## DB changes (all three features)

```sql
ALTER TABLE bookings ADD COLUMN reminded_24h boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN review_requested boolean NOT NULL DEFAULT false;
```

## Outside-codebase checklist

| Step | Where | When |
|------|-------|------|
| Run 2 SQL migrations above | Supabase SQL editor | Before deploy |
| Confirm `CRON_SECRET` env var exists | Vercel → Settings → Env Vars | Before deploy |
| Deploy with `vercel.json` cron config | Vercel | Deploy |
| Register client bot webhook (1 curl) | Terminal | After deploy |
| Verify webhook: `getWebhookInfo` | Terminal | After deploy |
