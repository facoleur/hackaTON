import { answerCallbackQuery, editTelegramMessage } from '@/lib/telegram';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const cq = update.callback_query;
    if (!cq) return NextResponse.json({ ok: true });

    const [action, bookingId, ratingStr] = (cq.data as string).split(':');

    if (action === 'rate' && bookingId && ratingStr) {
      const rating = parseInt(ratingStr);
      if (rating >= 1 && rating <= 5) {
        await supabaseAdmin
          .from('bookings')
          .update({ rating })
          .eq('id', bookingId);
      }

      const token = process.env.TELEGRAM_BOT_TOKEN!;

      await Promise.allSettled([
        answerCallbackQuery(token, cq.id),
        cq.message
          ? editTelegramMessage(
              token,
              cq.message.chat.id,
              cq.message.message_id,
              `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} — thanks for your rating!`,
            )
          : Promise.resolve(),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[telegram/webhook] error:', err);
    return NextResponse.json({ ok: true }); // always 200 to Telegram
  }
}
