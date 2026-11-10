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
    const [{ data: digests, error }, { data: preferences }] = await Promise.all([
      supabaseAdmin
        .from('daily_digests')
        .select('*')
        .eq('user_id', targetUserId)
        .order('generated_at', { ascending: false })
        .limit(30),
      supabaseAdmin
        .from('user_preferences')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle()
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ digests: digests || [], preferences: preferences || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch digests' }, { status: 500 });
  }
}

// PUT /api/digests - Authoritative server-side update for user digest preferences
export async function PUT(req: NextRequest) {
  const verifiedUser = await getVerifiedUser(req);

  if (!verifiedUser) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid Supabase session required to update digest preferences.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { summary_frequency, delivery_channels, comparison_intervals } = body;

    const { data: existingPref } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', verifiedUser.id)
      .maybeSingle();

    let existingChannels: Record<string, any> = {};
    if (existingPref?.delivery_channels) {
      try {
        existingChannels = typeof existingPref.delivery_channels === 'string'
          ? JSON.parse(existingPref.delivery_channels)
          : existingPref.delivery_channels;
      } catch {}
    }

    let incomingChannels: Record<string, any> = {};
    if (delivery_channels) {
      try {
        incomingChannels = typeof delivery_channels === 'string'
          ? JSON.parse(delivery_channels)
          : delivery_channels;
      } catch {}
    }

    const nowIso = new Date().toISOString();
    const nextFreq = summary_frequency || existingPref?.summary_frequency || 'daily';

    // Preserve last_sent_at and retailer_targets across preference updates.
    const mergedChannels: Record<string, any> = {
      ...existingChannels,
      ...incomingChannels,
    };
    if (existingChannels.last_sent_at && !incomingChannels.last_sent_at) {
      mergedChannels.last_sent_at = existingChannels.last_sent_at;
    }

    const nextIntervals = comparison_intervals
      ? (typeof comparison_intervals === 'string' ? comparison_intervals : JSON.stringify(comparison_intervals))
      : (existingPref?.comparison_intervals
          ? (typeof existingPref.comparison_intervals === 'string' ? existingPref.comparison_intervals : JSON.stringify(existingPref.comparison_intervals))
          : JSON.stringify(['24h', '7d', '30d', 'ATL']));

    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: verifiedUser.id,
        summary_frequency: nextFreq,
        delivery_channels: JSON.stringify(mergedChannels),
        comparison_intervals: nextIntervals,
        auto_recommend_alternatives: existingPref?.auto_recommend_alternatives ?? true,
        updated_at: nowIso
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, preferences: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update digest preferences' }, { status: 500 });
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
