import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfzokxffhmedvtuhykdw.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mem9reGZmaG1lZHZ0dWh5a2R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk2NjU2MiwiZXhwIjoyMTAxNTQyNTYyfQ.Mql6HmvstXQMIe7486WcLpV4tfjPznKuGJkjHdIOtI4';

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
