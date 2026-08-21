import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfzokxffhmedvtuhykdw.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                      process.env.SUPABASE_ANON_KEY || 
                      process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      '';
  return createClient(supabaseUrl, supabaseKey);
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});
