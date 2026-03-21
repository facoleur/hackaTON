import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { validateInitData, parseInitDataUser } from '@/lib/telegram';
import type { Role } from '@/lib/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, role } = body as { initData: string; role: Role };

    if (!initData || !role) {
      return NextResponse.json({ error: 'Missing initData or role' }, { status: 400 });
    }

    const botToken =
      role === 'client'
        ? process.env.TELEGRAM_BOT_TOKEN_CLIENT!
        : process.env.TELEGRAM_BOT_TOKEN_THERAPIST!;

    // Validate signature (skip in development for local testing)
    if (process.env.NODE_ENV !== 'development') {
      validateInitData(initData, botToken);
    }

    // Parse user from initData
    const tgUser = parseInitDataUser(initData);
    if (!tgUser) {
      return NextResponse.json({ error: 'No user in initData' }, { status: 400 });
    }

    // Upsert user in DB
    const { data: user, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          username: tgUser.username ?? null,
          role,
        },
        { onConflict: 'telegram_id' }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // Mint JWT
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);
    const token = await new SignJWT({ sub: user.id, role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    return NextResponse.json({ token, user });
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Auth failed' },
      { status: 401 }
    );
  }
}
