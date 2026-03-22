import * as crypto from 'crypto';

/**
 * Validates Telegram initData signature using the bot token.
 * Returns parsed user data if valid, throws if invalid.
 */
export function validateInitData(
  initData: string,
  botToken: string
): Record<string, string> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('Missing hash in initData');

  params.delete('hash');

  const entries = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (expectedHash !== hash) {
    console.error('[telegram] hash mismatch | expected:', expectedHash.slice(0, 10), '| got:', hash?.slice(0, 10));
    throw new Error('Invalid initData signature');
  }

  const result: Record<string, string> = {};
  for (const [k, v] of entries) {
    result[k] = v;
  }
  return result;
}

export function parseInitDataUser(initData: string): {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
} | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}
