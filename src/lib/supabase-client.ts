import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

let cachedClient: SupabaseClient | null = null;
let cachedToken: string | null = null;

export function getSupabaseClient(token?: string | null): SupabaseClient {
  if (token && token !== cachedToken) {
    cachedToken = token;
    cachedClient = null;
  }

  if (cachedClient) return cachedClient;

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
