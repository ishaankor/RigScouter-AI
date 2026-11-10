import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfzokxffhmedvtuhykdw.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseKey && typeof window === 'undefined') {
    console.warn('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY environment variable is not set. Service-role operations will fail.');
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });

  return supabaseAdminInstance;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdmin();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});
