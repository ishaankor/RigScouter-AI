import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export const runtime = 'edge';

// GET /api/digests?userId=... - Fetch past digests for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    const { data: digests, error } = await supabaseAdmin
      .from('daily_digests')
      .select('*')
      .eq('user_id', userId)
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

// POST /api/digests - Manually record/snapshot a digest into daily_digests
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, report } = body;

    if (!userId || !report) {
      return NextResponse.json({ error: 'Missing userId or report payload' }, { status: 400 });
    }

    const newDigest = {
      id: crypto.randomUUID(),
      user_id: userId,
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

