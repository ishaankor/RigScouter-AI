import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfzokxffhmedvtuhykdw.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                      process.env.SUPABASE_ANON_KEY || 
                      process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      '';
  
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
    }
  });

  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});
