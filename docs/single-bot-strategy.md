# Single Bot Strategy

## Goal

One Telegram bot, one mini app URL, one deployment.

```
t.me/canette_marketplace_bot/canette
```

Both clients and therapists open this same URL. Role selection happens inside the app on first open (already implemented). The bot is `canette_marketplace_bot`.

---

## What changes

### 1. Single bot token

Replace the two-token setup with one:

| Before | After |
|---|---|
| `TELEGRAM_BOT_TOKEN_CLIENT` | `TELEGRAM_BOT_TOKEN` |
| `TELEGRAM_BOT_TOKEN_THERAPIST` | _(removed)_ |

`TELEGRAM_BOT_TOKEN` = `canette_marketplace_bot` token (the one in `TELEGRAM_BOT_TOKEN_CLIENT` today).

All routes that currently reference either token switch to `TELEGRAM_BOT_TOKEN`.

### 2. Auth route (`src/app/api/auth/route.ts`)

```ts
// before
const validationToken = process.env.TELEGRAM_BOT_TOKEN_THERAPIST!;

// after
const validationToken = process.env.TELEGRAM_BOT_TOKEN!;
```

### 3. Notification routes

All three routes use `clientToken` / `therapistToken` to send messages. Collapse to one:

```ts
// before
const clientToken = process.env.TELEGRAM_BOT_TOKEN_CLIENT!;
const therapistToken = process.env.TELEGRAM_BOT_TOKEN_THERAPIST!;

// after
const token = process.env.TELEGRAM_BOT_TOKEN!;
```

Both client and therapist messages are sent via the same bot. They receive messages from `canette_marketplace_bot`.

Affected files:
- `src/app/api/notifications/payment-confirmed/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/telegram/webhook/route.ts`

### 4. Env vars

`.env` and Vercel:

```env
TELEGRAM_BOT_TOKEN=<canette_marketplace_bot token>

# Remove or leave unused:
# TELEGRAM_BOT_TOKEN_CLIENT
# TELEGRAM_BOT_TOKEN_THERAPIST

NEXT_PUBLIC_CLIENT_TWA_URL=https://t.me/canette_marketplace_bot/canette
NEXT_PUBLIC_THERAPIST_TWA_URL=https://t.me/canette_marketplace_bot/canette
# Both point to the same URL — role is chosen inside the app
```

### 5. Telegram webhook

The webhook is currently registered on `canette_therapist_bot`. Re-register it on `canette_marketplace_bot`:

```
curl -X POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook { "url": "https://hacka-ton-dun.vercel.app/api/telegram/webhook" }
```

curl -X POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook { "url": "https://hacka-ton-dun.vercel.app/api/telegram/webhook" }


---

## What does NOT change

- Next.js routing: `/` for clients, `/therapist` for therapists — untouched
- Role selection on first open — untouched
- Supabase, JWT, TonConnect — untouched
- All business logic — untouched

---

## Implementation order

1. Update `.env` locally (rename tokens)
2. Update the 4 API route files (swap token variable names)
3. Update Vercel env vars
4. Re-register webhook on `canette_marketplace_bot`
5. Redeploy

---

## Why this is correct

When a user opens `t.me/canette_marketplace_bot/canette`, Telegram signs their initData with `canette_marketplace_bot`'s token. Auth validates with the same token. Hash matches. No more 401.
