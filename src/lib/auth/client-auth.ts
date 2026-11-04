import { supabase } from '@/lib/db/supabase';

/**
 * Retrieves the active Supabase session access token and formats it
 * as an Authorization header for authenticated API calls.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    }
  } catch (err) {
    console.warn('[Auth] Could not retrieve session access token:', err);
  }
  return {};
}

