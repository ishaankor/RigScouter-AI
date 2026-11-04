import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { getVerifiedUser } from '@/lib/auth/server-auth';

export const runtime = 'edge';

// GET /api/digests - Fetch past digests for the authenticated user
export async function GET(req: NextRequest) {
  const verifiedUser = await getVerifiedUser(req);

  if (!verifiedUser) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid Supabase session required to access digest history.' },
      { status: 401 }
    );
  }

  // System/cron jobs can pass a target userId; normal users strictly access their own data
  const requestedUserId = req.nextUrl.searchParams.get('userId');
  const targetUserId = (verifiedUser.role === 'service' && requestedUserId) ? requestedUserId : verifiedUser.id;

  try {
    const { data: digests, error } = await supabaseAdmin
      .from('daily_digests')
      .select('*')
      .eq('user_id', targetUserId)
      .order('generated_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ digests: digests || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch digests' }, { status: 500 });
  }
}

// POST /api/digests - Record a digest snapshot for the authenticated user
export async function POST(req: NextRequest) {
  const verifiedUser = await getVerifiedUser(req);

  if (!verifiedUser) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid Supabase session required to save digest records.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { report } = body;

    if (!report) {
      return NextResponse.json({ error: 'Missing report payload' }, { status: 400 });
    }

    const newDigest = {
      id: crypto.randomUUID(),
      user_id: verifiedUser.id,
      headline: report.headline || 'Hardware Market Intelligence Briefing',
      executive_summary: report.executiveSummary || 'Live hardware pricing snapshot.',
      report_data: report,
      total_saved_opportunity: report.totalSavedOpportunity || 0,
      generated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('daily_digests')
      .insert(newDigest)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, digest: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save digest snapshot' }, { status: 500 });
  }
}
