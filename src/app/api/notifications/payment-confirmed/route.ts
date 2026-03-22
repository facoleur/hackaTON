import { sendTelegramMessage } from '@/lib/telegram';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export async function POST(req: NextRequest) {
  try {
    // Verify JWT
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);
    await jwtVerify(token, secret);

    const { bookingId, event } = (await req.json()) as {
      bookingId: string;
      event: 'upfront' | 'final';
    };

    if (!bookingId || !event) {
      return NextResponse.json({ error: 'Missing bookingId or event' }, { status: 400 });
    }

    const { data: booking } = await supabaseAdmin
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

    if (!booking) return NextResponse.json({ ok: true });

    const clientTelegramId = booking.client?.telegram_id;
    const therapistTelegramId = booking.therapist_profiles?.therapist_user?.telegram_id;
    const therapistName = booking.therapist_profiles?.display_name ?? 'your therapist';
    const clientName = booking.client?.first_name ?? 'Client';
    const date = booking.booking_date;
    const time = booking.start_time?.slice(0, 5);
    const txHash = event === 'upfront' ? booking.tx_hash_upfront : booking.tx_hash;
    const amount = booking.amount_ton;

    const botToken = process.env.TELEGRAM_BOT_TOKEN!;

    const clientMsg = event === 'upfront'
      ? `✅ Payment confirmed!\n\nYou paid ${amount} TON for your session with ${therapistName}.\n\n📅 ${date} at ${time}\n🔗 TX: ${txHash}`
      : `✅ Payment complete!\n\nYou've fully paid ${amount} TON for your session with ${therapistName}.\n\n📅 ${date} at ${time}\n🔗 TX: ${txHash}`;

    const therapistMsg = event === 'upfront'
      ? `💰 Payment received!\n\n${clientName} paid ${amount} TON for their session with you.\n\n📅 ${date} at ${time}\n🔗 TX: ${txHash}`
      : `💰 Final payment received!\n\n${clientName} has fully paid ${amount} TON. Session is complete.\n\n📅 ${date} at ${time}\n🔗 TX: ${txHash}`;

    await Promise.allSettled([
      clientTelegramId
        ? sendTelegramMessage(botToken, clientTelegramId, clientMsg)
        : Promise.resolve(),
      therapistTelegramId
        ? sendTelegramMessage(botToken, therapistTelegramId, therapistMsg)
        : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[payment-confirmed] error:', err);
    return NextResponse.json({ ok: true }); // never block the client
  }
}
