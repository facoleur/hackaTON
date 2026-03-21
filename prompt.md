# Prompt: Massage Booking TMA — Next.js 16 App Router

## What you are building

A Telegram Mini App marketplace where massage therapists create profiles and manage bookings, and clients browse therapists, book sessions, and pay on the TON blockchain. The app supports split payments: therapists set an upfront percentage (10-100%), clients pay that portion when the booking is confirmed, then pay the remainder after the session once they've rated the therapist.

---

## Tech stack

- **Framework**: Next.js 16 App Router (Turbopack default, `proxy.ts` replaces `middleware.ts`, async `params`/`searchParams`)
- **Language**: TypeScript strict
- **UI**: `@telegram-apps/telegram-ui` — official Telegram-native React component library. No Tailwind, no other CSS framework. Use only Telegram UI components and its built-in theme system.
- **Telegram SDK**: `@tma.js/sdk-react`
- **Wallet**: `@tonconnect/ui-react`
- **Database**: Supabase (PostgreSQL) via `@supabase/supabase-js`, accessed directly from the client via PostgREST
- **State**: Zustand (client-only, no persist middleware)
- **Data fetching**: TanStack Query for all reads and mutations
- **Deployment**: Vercel

---

## Architecture: two bots, one codebase

Two Telegram bots point to the same Next.js deployment at different paths:

- `@MassageBookBot` → `https://yourapp.com/client` (for clients)
- `@MassageProBot` → `https://yourapp.com/therapist` (for therapists)

No role selector. The user's role is determined by which bot they opened. Each bot has its own token, its own profile screenshots in BotFather, and sends notifications only to its audience.

---

## Project structure

```
app/
├── layout.tsx                       # Server component: global CSS, metadata
├── providers.tsx                    # 'use client': all providers (TonConnect, AppRoot, QueryClient, TMA SDK init)
├── api/
│   └── auth/route.ts                # ONLY Route Handler: validate initData, upsert user, mint Supabase JWT
├── client/                          # Client mini app (URL: /client)
│   ├── layout.tsx                   # Client shell + Tabbar (Browse | Bookings)
│   ├── page.tsx                     # Browse therapists grid
│   ├── therapist/[id]/page.tsx      # Therapist detail + book
│   ├── bookings/page.tsx            # My bookings list
│   └── pay/[bookingId]/page.tsx     # Payment screen (upfront or remainder)
├── therapist/                       # Therapist mini app (URL: /therapist)
│   ├── layout.tsx                   # Therapist shell + Tabbar (Dashboard | Profile)
│   ├── page.tsx                     # Incoming booking requests
│   ├── profile/page.tsx             # Edit profile, photos, price, upfront %
│   └── availability/page.tsx        # Weekly time slot manager

components/                          # Shared UI components
stores/                              # Zustand stores (NEVER inside app/)
hooks/                               # TanStack Query hooks (useTherapists, useBookings, etc.)
lib/
├── supabase-client.ts               # Supabase client factory using JWT from Zustand
├── telegram.ts                      # initData validation helper
├── ton.ts                           # Transaction helpers
├── query-keys.ts                    # Centralized TanStack Query key factory
└── types.ts                         # Shared TypeScript types
public/
└── tonconnect-manifest.json         # Required by TON Connect
```

---

## Next.js 16 rules

- Every `page.tsx` and `layout.tsx` receiving `params` or `searchParams` must `await` them (they are Promises in Next.js 16)
- Most pages are `'use client'` because they use TMA SDK hooks, wallet hooks, and browser APIs
- `app/layout.tsx` is a server component that only imports CSS and wraps children in `<Providers>`
- `app/providers.tsx` is `'use client'` and wraps: `QueryClientProvider`, `TonConnectUIProvider`, `<AppRoot>`, and runs the TMA SDK init sequence
- No `middleware.ts` (replaced by `proxy.ts` in Next.js 16, not needed for this app)
- No Server Actions — all mutations go through direct Supabase client calls via TanStack Query

---

## Data layer: direct Supabase + TanStack Query

### Auth flow (the only Route Handler)

`app/api/auth/route.ts` handles one thing:
1. Receives Telegram `initData` from the client
2. Validates the signature using the correct bot token (client or therapist, determined by a parameter)
3. Upserts the user in the `users` table (via Supabase service role, server-side)
4. Mints a JWT signed with `SUPABASE_JWT_SECRET`, with `sub` = user ID, `role` = `authenticated`
5. Returns the JWT and user data

The client calls this once on app mount, stores the JWT in Zustand `useAuthStore`, and uses it for all subsequent Supabase calls.

### Client-side Supabase

`lib/supabase-client.ts` creates a Supabase client that reads the JWT from `useAuthStore` and passes it as the `Authorization` header. All reads and writes go directly to Supabase PostgREST — no other Route Handlers needed.

### TanStack Query

- `lib/query-keys.ts`: centralized key factory (`queryKeys.therapists.list()`, `queryKeys.bookings.byUser(id)`, etc.)
- `hooks/` directory: one file per domain — `useTherapists.ts`, `useBookings.ts`, `usePayments.ts`, `useProfile.ts`, `useAvailability.ts`
- Every hook uses `getSupabaseClient()` and calls Supabase directly
- Every mutation calls `queryClient.invalidateQueries()` on success to keep data fresh
- `QueryClientProvider` in `providers.tsx` with `defaultOptions.queries.staleTime: 30_000`

### RLS policies

- Therapist profiles: public read when `is_active = true`
- Bookings: users can only read bookings where they are the `client_id` or `therapist_id`
- Bookings insert: `client_id` must match `auth.uid()`
- Bookings update: only the relevant party can update (therapist confirms, client pays)
- Therapist profiles update: only the owning user

### Exception: Telegram Bot notifications

Sending notifications via Telegram Bot API requires the bot token, which must stay server-side. Use either a Supabase Edge Function triggered by a database webhook on the `bookings` table, or a second Route Handler `app/api/notify/route.ts`.

---

## Zustand rules

- All stores in `stores/` directory, never inside `app/`
- Every file importing a store must have `'use client'`
- No `persist` middleware — TMA provides user identity on every launch, booking data is in Supabase
- Always type stores with an interface
- Always use selectors: `useAuthStore(s => s.role)` not `useAuthStore()`
- Define an `initialState` object and a `reset()` action on every store

### Stores needed

- `useAuthStore`: `telegramUser`, `role`, `supabaseToken`, `walletAddress`
- `useUIStore`: `activeTab`, loading flags if needed

---

## Database schema

### users
`id` (uuid PK), `telegram_id` (bigint unique), `username`, `first_name`, `role` ('client' | 'therapist'), `wallet_address`, `created_at`

### therapist_profiles
`id` (uuid PK), `user_id` (FK users, unique), `display_name`, `bio`, `price_ton` (decimal), `duration_minutes` (int, default 60), `upfront_percent` (int, 10-100, default 100), `location_name`, `location_lat`, `location_lng`, `photos` (text[]), `rating` (decimal), `is_active` (bool), `created_at`

### availability
`id` (uuid PK), `therapist_id` (FK therapist_profiles), `day_of_week` (int 0-6), `start_time` (time), `end_time` (time), unique on (therapist_id, day_of_week, start_time)

### bookings
`id` (uuid PK), `client_id` (FK users), `therapist_id` (FK therapist_profiles), `booking_date` (date), `start_time` (time), `duration_minutes` (int), `amount_ton` (decimal, total price), `upfront_percent` (int, snapshot from therapist), `upfront_amount` (decimal), `remaining_amount` (decimal), `status` (enum below), `tx_hash_upfront`, `tx_hash_final`, `rating` (int 1-5), `review` (text), `created_at`, `updated_at`

### Booking status enum
`pending` → `confirmed` → `upfront_paid` → `completed` → `fully_paid`
Also: `rejected`, `cancelled`

---

## Booking + payment flow

```
Client browses → picks therapist → selects time slot → "Book" (MainButton)
  → createBooking mutation (status: pending, snapshot upfront_percent and compute amounts)
  → Notify therapist via bot

Therapist sees request → taps "Confirm" or "Reject"
  → confirmBooking mutation (status: confirmed)
  → Notify client via bot

Client sees confirmed booking → "Pay X TON upfront" (MainButton)
  → TON Connect sendTransaction (upfront_amount → therapist wallet)
  → payUpfront mutation (status: upfront_paid, store tx_hash_upfront)

  If upfront_percent = 100 → skip to fully_paid, rating is optional

Therapist marks session done
  → completeBooking mutation (status: completed)
  → Notify client

Client sees completed booking → rating form (1-5 stars + optional review)
  → rateBooking mutation (store rating + review)
  → Remaining payment unlocks → "Pay X TON remaining" (MainButton)
  → TON Connect sendTransaction (remaining_amount → therapist wallet)
  → payFinal mutation (status: fully_paid, store tx_hash_final)
```

---

## TON payment specification

Each payment is a direct wallet-to-wallet transfer using `tonConnectUI.sendTransaction()`. No smart contract or escrow needed.

Transaction structure:
- `validUntil`: current time + 600 seconds
- `messages`: one message with therapist `wallet_address` and amount in nanotoncoin (`Math.round(amountTon * 1e9).toString()`)

The `PayButton` component is reusable for both upfront and remainder payments. It accepts: `therapistWallet`, `amountTon`, `label` (e.g. "Pay 0.5 TON upfront"), and an `onSuccess(boc)` callback. If wallet is not connected, it opens the TON Connect modal first.

Enable `miniApp.setClosingConfirmation(true)` before payment and disable after.

---

## TMA SDK init sequence (providers.tsx)

On mount, the providers must run this sequence:
1. `initSDK()` — initialize the TMA SDK
2. `expandViewport()` — app starts minimized in BottomSheet otherwise
3. Mount `backButton`, `miniApp`, `themeParams`, `swipeBehavior`
4. Restore `initData`
5. After `viewport.mount()` resolves: call `viewport.bindCssVars()`, `miniApp.bindCssVars()`, `themeParams.bindCssVars()`
6. Call `swipeBehavior.disableVertical()` globally (re-enable only if needed)

---

## Mobile & TMA platform rules

### Official Telegram design guidelines
- All elements responsive, mobile-first
- Interactive elements must mimic Telegram's existing UI style
- Animations smooth, target 60fps
- All inputs and images must have labels (accessibility)
- Use dynamic theme colors from the API — never hardcode colors
- Respect safe area and content safe area insets
- On Android: check User-Agent for performance class, reduce animations on low-end devices

### Viewport
- Use `var(--tg-viewport-stable-height)` for bottom-pinned elements — NOT `viewportHeight` (refresh rate too low for smooth pinning)
- Never use `100vh` — it includes Telegram's chrome
- Safe area insets available via SDK (`safeAreaInset`, `contentSafeAreaInset`) — CSS `env(safe-area-inset-*)` does not work reliably in Telegram WebView

### Touch and gestures
- `swipeBehavior.disableVertical()` during payment and critical flows
- No horizontal scrollables within 20px of screen edges (iOS back-swipe conflict)
- Minimum 44×44px touch targets
- No hover-dependent UI
- Minimum 16px font-size on input fields (prevents iOS auto-zoom)

---

## UI components

Use `@telegram-apps/telegram-ui` for everything. Key components:
- `<AppRoot>`: root wrapper, auto-syncs theme
- `<Cell>`: list rows (therapist cards, booking items)
- `<Section>`: group related content
- `<List>`: wraps multiple Cells
- `<Avatar>`: therapist photos
- `<Badge>`: booking status pills
- `<Button>`: all buttons
- `<Input>`, `<Textarea>`: form fields
- `<Tabbar>`: bottom navigation
- `<Spinner>`: loading (prefer skeleton screens over spinners)
- `<Placeholder>`: empty states
- `<Modal>`: confirmation dialogs
- `<TonConnectButton />`: wallet connection (from `@tonconnect/ui-react`)

### Native TMA features to use
- **MainButton**: primary action per screen (Book, Confirm, Pay). Supports loading state and disabling.
- **BackButton**: show on all screens except root. Wire to `router.back()`.
- **Haptic feedback**: `impactOccurred('light')` on taps, `'medium'` on confirms, `notificationOccurred('success'|'error')` on results.
- **Closing confirmation**: enable during payment flows.

---

## Environment variables

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
TELEGRAM_BOT_TOKEN_CLIENT=...
TELEGRAM_BOT_TOKEN_THERAPIST=...
```
