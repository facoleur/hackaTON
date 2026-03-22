import { sendTelegramMessage, sendTelegramInlineKeyboard } from '@/lib/telegram';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const token = process.env.TELEGRAM_BOT_TOKEN!;

  // ── 24h reminders ──────────────────────────────────────────────────────────

  const { data: toRemind } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_date, start_time, duration_minutes,
      client:users!client_id (telegram_id, first_name),
      therapist_profiles (
        display_name,
        therapist_user:users!user_id (telegram_id)
      )
    `)
    .in('status', ['confirmed', 'fully_paid'])
    .eq('booking_date', toDateString(tomorrow))
    .eq('reminded_24h', false);

  for (const booking of toRemind ?? []) {
    const client = Array.isArray(booking.client) ? booking.client[0] : booking.client;
    const therapistProfile = Array.isArray(booking.therapist_profiles) ? booking.therapist_profiles[0] : booking.therapist_profiles;
    const therapistUser = therapistProfile && (Array.isArray((therapistProfile as any).therapist_user) ? (therapistProfile as any).therapist_user[0] : (therapistProfile as any).therapist_user);
    const clientId = (client as any)?.telegram_id;
    const therapistId = (therapistUser as any)?.telegram_id;
    const therapistName = (therapistProfile as any)?.display_name ?? 'your therapist';
    const clientName = (client as any)?.first_name ?? 'Client';
    const time = booking.start_time?.slice(0, 5);
    const date = booking.booking_date;
    const duration = booking.duration_minutes;

    await Promise.allSettled([
      clientId
        ? sendTelegramMessage(token, clientId,
            `⏰ Reminder: session tomorrow\n\nYour session with ${therapistName} is tomorrow.\n📅 ${date} at ${time} · ${duration} min`)
        : Promise.resolve(),
      therapistId
        ? sendTelegramMessage(token, therapistId,
            `⏰ Reminder: session tomorrow\n\nYou have a session with ${clientName} tomorrow.\n📅 ${date} at ${time} · ${duration} min`)
        : Promise.resolve(),
    ]);

    await supabaseAdmin
      .from('bookings')
      .update({ reminded_24h: true })
      .eq('id', booking.id);
  }

  // ── Review requests ─────────────────────────────────────────────────────────

  const { data: toReview } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_date, start_time,
      client:users!client_id (telegram_id),
      therapist_profiles (display_name)
    `)
    .in('status', ['fully_paid', 'completed'])
    .eq('booking_date', toDateString(yesterday))
    .eq('review_requested', false);

  for (const booking of toReview ?? []) {
    const client = Array.isArray(booking.client) ? booking.client[0] : booking.client;
    const therapistProfile = Array.isArray(booking.therapist_profiles) ? booking.therapist_profiles[0] : booking.therapist_profiles;
    const clientId = (client as any)?.telegram_id;
    const therapistName = (therapistProfile as any)?.display_name ?? 'your therapist';

    if (clientId) {
      const buttons = [1, 2, 3, 4, 5].map((n) => ({
        text: `${n} ${'★'.repeat(n)}`,
        callback_data: `rate:${booking.id}:${n}`,
      }));

      await sendTelegramInlineKeyboard(
        token,
        clientId,
        `⭐ How was your session?\n\nRate your session with ${therapistName}:`,
        buttons,
      );
    }

    await supabaseAdmin
      .from('bookings')
      .update({ review_requested: true })
      .eq('id', booking.id);
  }

  return NextResponse.json({
    ok: true,
    reminded: toRemind?.length ?? 0,
    reviewRequested: toReview?.length ?? 0,
  });
}
