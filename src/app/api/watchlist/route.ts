import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { getDailyTrendingWatchlist } from '@/lib/scrapers/trending-engine';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .order('added_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const formatted = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        componentName: item.component_name,
        category: item.category as any,
        targetPrice: item.target_price,
        currentPrice: item.current_price,
        previousPrice24h: item.previous_price_24h || undefined,
        previousPrice7d: item.previous_price_7d || undefined,
        previousPrice30d: item.previous_price_30d || undefined,
        allTimeLow: item.all_time_low || undefined,
        retailer: item.retailer as any,
        productUrl: item.product_url,
        imageUrl: item.image_url,
        inStock: item.in_stock,
        notifyOnFlashDrop: item.notify_on_flash_drop,
        addedAt: item.added_at
      }));

      return NextResponse.json({ source: 'database', items: formatted });
    }
  } catch (e) {
    console.warn('Watchlist DB fetch fallback:', e);
  }

  // Daily Rotating Trending PC Parts Watchlist
  const dailyWatchlist = getDailyTrendingWatchlist();
  return NextResponse.json({ source: 'daily_trending', items: dailyWatchlist });
}
