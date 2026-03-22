# New Booking Notification

## Goal

When a client completes a booking (payment sent), the **therapist** receives a Telegram message informing them of the new booking.

---

## Trigger

`useBookAndPay` — after the booking is inserted and status updated to `fully_paid`, fire a non-blocking notification to the therapist.

---

## Architecture

Same pattern as `payment-confirmed`: client hook calls a Next.js API route after the DB write succeeds. The route fetches the joined data and sends the Telegram message server-side.

```
POST /api/notifications/new-booking
Headers: Authorization: Bearer <supabaseToken>
Body: { bookingId: string }
```

---

## Data to fetch in the route

```ts
supabase
  .from('bookings')
  .select(`
    *,
    client:users!client_id (first_name),
    therapist_profiles (
      display_name,
      therapist_user:users!user_id (telegram_id)
    )
  `)
  .eq('id', bookingId)
  .single()
```

---

## Message template (therapist only)

```
📅 New booking!

{client_first_name} booked a {duration_minutes} min session with you.

📅 {booking_date} at {start_time}
💰 {amount_ton} TON paid
```

---

## Files to create / modify

| File | Action |
|------|--------|
| `src/app/api/notifications/new-booking/route.ts` | New API route |
| `src/hooks/useBookAndPay.ts` | Call the route after successful mutation + remove debug logs |

---

## Implementation notes

- Fire with `.catch(console.error)` — non-blocking, must never throw
- Reuse the JWT from `useAuthStore` for the Authorization header, same as `payment-confirmed`
- Reuse `sendTelegramMessage` from `src/lib/telegram.ts` — no new helpers needed
- Only notify the therapist (client already sees the BookingSuccessCard in the drawer)
