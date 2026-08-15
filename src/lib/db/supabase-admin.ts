import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfzokxffhmedvtuhykdw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key-to-prevent-crash';

// The admin client uses the service role key to completely bypass Row Level Security (RLS).
// Only use this in protected backend API routes, never expose it to the frontend!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
