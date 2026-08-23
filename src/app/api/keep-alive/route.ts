import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // Perform real database query to record activity on Supabase
    const { data, count, error } = await supabase
      .from('hardware_components')
      .select('id, name, updated_at', { count: 'exact' })
      .limit(3);

    const latencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: 'warning',
          message: 'Supabase responded with an error',
          error: error.message,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'online',
      message: 'Supabase keep-alive ping successful',
      database: 'connected',
      latencyMs,
      recordsFound: data?.length ?? 0,
      totalCount: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Internal error executing keep-alive query',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
