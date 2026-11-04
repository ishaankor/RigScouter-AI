import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export interface VerifiedUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Validates the caller's identity via:
 * 1. Cryptographic Supabase Auth JWT token (Authorization: Bearer <access_token>)
 * 2. Or internal system CRON_SECRET for authorized machine-to-machine cron jobs
 */
export async function getVerifiedUser(req: NextRequest): Promise<VerifiedUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    // Check if internal machine CRON_SECRET is being used
    const cronSecret = process.env.CRON_SECRET || 'rigscouter-cron-secret';
    if (token === cronSecret) {
      return { id: 'system-internal', email: 'system@rigscouter.ai', role: 'service' };
    }

    // Verify token with Supabase Auth
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return null;
      return { id: user.id, email: user.email, role: 'authenticated' };
    } catch {
      return null;
    }
  }

  return null;
}

