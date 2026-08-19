import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { scrapeTavilyAndSaveToDb } from '@/lib/scrapers/tavily-scraper';

export const runtime = 'edge';

// Cron handler triggered periodically (e.g., via Cloudflare Cron Triggers or GitHub Actions)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'rigscouter-cron-secret';

  // Basic security check for automated triggers
  if (authHeader !== `Bearer ${cronSecret}` && req.nextUrl.searchParams.get('key') !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized cron execution request' }, { status: 401 });
  }

  try {
    // 1. Fetch tracked hardware names from database
    const { data: dbItems } = await supabase.from('hardware_components').select('name, model');

    const itemsToUpdate = dbItems && dbItems.length > 0
      ? dbItems.map(i => i.model || i.name)
      : ['RTX 4070 Super', 'Ryzen 7 7800X3D', 'Samsung 990 Pro 2TB'];

    const updateResults = [];

    for (const itemName of itemsToUpdate) {
      try {
        const result = await scrapeTavilyAndSaveToDb(itemName);
        updateResults.push({ item: itemName, status: 'updated', price: result.component.currentPrice });
      } catch (err: any) {
        updateResults.push({ item: itemName, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      updatedCount: updateResults.length,
      results: updateResults
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cron scrape failed' }, { status: 500 });
  }
}
