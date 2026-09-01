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

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';

  // 1. Delegate to the backend proxy service which uses the optimized two-tier 0-credit pipeline
  try {
    const backendRes = await fetch(`${backendUrl.replace(/\/$/, '')}/api/cron/trigger-daily-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json({
        status: 'delegated_to_backend_proxy',
        backendResponse: data,
        timestamp: new Date().toISOString()
      });
    }
  } catch (proxyErr) {
    console.warn('[Cron Update-Prices] Backend proxy unreachable, falling back to local edge updater:', proxyErr);
  }

  // 2. Fallback edge updater: Only refresh active user watchlist items (max 5) to conserve API keys
  try {
    const { data: wlItems } = await supabase
      .from('watchlist_items')
      .select('component_name')
      .limit(5);

    const itemsToUpdate = wlItems && wlItems.length > 0
      ? wlItems.map(i => i.component_name)
      : ['RTX 4070 Super', 'Ryzen 7 7800X3D', 'Samsung 990 Pro 2TB'];

    const updateResults = [];

    for (const itemName of itemsToUpdate) {
      try {
        const result = await scrapeTavilyAndSaveToDb(itemName);
        updateResults.push({ item: itemName, status: 'updated', price: result.component?.currentPrice });
      } catch (err: any) {
        updateResults.push({ item: itemName, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({
      status: 'completed_edge_fallback',
      timestamp: new Date().toISOString(),
      updatedCount: updateResults.length,
      results: updateResults
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cron scrape failed' }, { status: 500 });
  }
}

