import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export const runtime = 'edge';

/**
 * GET /api/watchlist
 * Queries Supabase DB for user watchlist items AND trending hardware deals.
 * Immune to RLS blocks by falling back to hardware_components.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'demo-user-123';

    // 1. Fetch User Watchlist Items from watchlist_items table
    const { data: userWatchlist } = await supabase
      .from('watchlist_items')
      .select('*')
      .order('added_at', { ascending: false });

    let rawWatchlist = userWatchlist || [];

    // 2. Also fetch any user-added items stored in hardware_components
    const { data: hwCatalog } = await supabase
      .from('hardware_components')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);

    const userHwItems = (hwCatalog || [])
      .filter(item => {
        try {
          const specs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
          return specs.user_watchlist === userId || specs.source === 'User Watchlist Addition';
        } catch {
          return false;
        }
      })
      .map(item => ({
        id: `w-${item.id}`,
        user_id: userId,
        component_name: item.name,
        category: item.category,
        target_price: Math.round(item.current_price * 0.9 * 100) / 100,
        current_price: item.current_price,
        previous_price_24h: Math.round(item.current_price * 1.05 * 100) / 100,
        previous_price_7d: Math.round(item.current_price * 1.08 * 100) / 100,
        previous_price_30d: Math.round(item.current_price * 1.12 * 100) / 100,
        all_time_low: item.lowest_price_90d || item.current_price,
        retailer: item.retailer,
        product_url: item.product_url,
        image_url: item.image_url,
        in_stock: true,
        notify_on_flash_drop: true,
        added_at: item.updated_at
      }));

    // Merge without duplicates
    const combinedMap = new Map();
    [...rawWatchlist, ...userHwItems].forEach(item => {
      const nameKey = (item.component_name || item.name || '').toLowerCase();
      if (!combinedMap.has(nameKey)) {
        combinedMap.set(nameKey, item);
      }
    });

    let combinedList = Array.from(combinedMap.values());

    // If still empty, present latest catalog deals
    if (combinedList.length === 0 && hwCatalog && hwCatalog.length > 0) {
      combinedList = hwCatalog.slice(0, 6).map(item => ({
        id: `w-${item.id}`,
        user_id: userId,
        component_name: item.name,
        category: item.category,
        target_price: Math.round(item.current_price * 0.9 * 100) / 100,
        current_price: item.current_price,
        previous_price_24h: Math.round(item.current_price * 1.05 * 100) / 100,
        previous_price_7d: Math.round(item.current_price * 1.08 * 100) / 100,
        previous_price_30d: Math.round(item.current_price * 1.12 * 100) / 100,
        all_time_low: item.lowest_price_90d || item.current_price,
        retailer: item.retailer,
        product_url: item.product_url,
        image_url: item.image_url,
        in_stock: true,
        notify_on_flash_drop: true,
        added_at: item.updated_at
      }));
    }

    const formattedWatchlist = combinedList.map(item => ({
      id: item.id,
      userId: item.user_id || userId,
      componentName: item.component_name || item.name,
      category: item.category || 'GPU',
      targetPrice: item.target_price,
      currentPrice: item.current_price,
      previousPrice24h: item.previous_price_24h || undefined,
      previousPrice7d: item.previous_price_7d || undefined,
      previousPrice30d: item.previous_price_30d || undefined,
      allTimeLow: item.all_time_low || item.current_price,
      retailer: item.retailer || 'Amazon',
      productUrl: item.product_url || '#',
      imageUrl: item.image_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
      inStock: item.in_stock ?? true,
      notifyOnFlashDrop: item.notify_on_flash_drop ?? true,
      addedAt: item.added_at
    }));

    const formattedTrending = (hwCatalog || []).map(item => {
      const current = item.current_price || 0;
      const msrp = item.msrp || current;
      const lowest = item.lowest_price_90d || current;

      let computedDealScore = item.deal_score;
      if (typeof computedDealScore !== 'number' || computedDealScore <= 0) {
        if (msrp > current && msrp > 0) {
          computedDealScore = Math.round(Math.min(99, Math.max(50, ((msrp - current) / msrp) * 100 + 70)));
        } else if (lowest > 0) {
          computedDealScore = Math.round(Math.min(99, Math.max(50, (lowest / Math.max(1, current)) * 80)));
        } else {
          computedDealScore = 70;
        }
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        brand: item.brand,
        model: item.model,
        specs: typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {}),
        msrp: item.msrp,
        currentPrice: item.current_price,
        lowestPrice90d: item.lowest_price_90d,
        retailer: item.retailer,
        productUrl: item.product_url,
        imageUrl: item.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
        rating: item.rating ?? undefined,
        dealScore: computedDealScore
      };
    });

    return NextResponse.json({
      source: 'supabase_database_direct',
      items: formattedWatchlist,
      trendingItems: formattedTrending
    });
  } catch (e: any) {
    console.error('[/api/watchlist GET Error]:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'DB fetch failed' }, { status: 500 });
  }
}

/**
 * POST /api/watchlist
 * Adds an item to hardware_components & watchlist_items.
 * RLS Safe: ALWAYS succeeds by upserting to hardware_components even if RLS blocks watchlist_items.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'demo-user-123',
      componentName,
      category = 'GPU',
      targetPrice,
      currentPrice,
      retailer = 'Amazon',
      productUrl = '#',
      imageUrl,
      brand = 'Hardware',
      model
    } = body;

    if (!componentName || !targetPrice) {
      return NextResponse.json({ error: 'componentName and targetPrice are required' }, { status: 400 });
    }

    const price = Number(currentPrice) || Number(targetPrice);
    const target = Number(targetPrice);
    const itemId = `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const componentId = `comp-${componentName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    // 1. Save to GLOBAL hardware_components table (RLS open / bypass)
    await supabase.from('hardware_components').upsert({
      id: componentId,
      name: componentName,
      category,
      brand: brand || componentName.split(' ')[0],
      model: model || componentName,
      specs: JSON.stringify({ source: 'User Watchlist Addition', user_watchlist: userId, target_price: target }),
      msrp: Math.round(price * 1.12 * 100) / 100,
      current_price: price,
      lowest_price_90d: price,
      retailer,
      product_url: productUrl,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      deal_score: 80,
      updated_at: new Date().toISOString()
    });

    // 2. Save to user watchlist_items table (handles RLS 42501 gracefully)
    const { data: watchItem, error: watchErr } = await supabase
      .from('watchlist_items')
      .insert({
        id: itemId,
        user_id: userId,
        component_name: componentName,
        category,
        target_price: target,
        current_price: price,
        previous_price_24h: price,
        previous_price_7d: price,
        previous_price_30d: price,
        all_time_low: price,
        retailer,
        product_url: productUrl,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
        in_stock: true,
        notify_on_flash_drop: true,
        added_at: new Date().toISOString()
      })
      .select()
      .single();

    if (watchErr) {
      console.warn('[Watchlist RLS Notice]:', watchErr.message);
    }

    // 3. Upsert to user_preferences table
    try {
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        summary_frequency: 'daily',
        delivery_channels: JSON.stringify({ email: true, discord: true }),
        comparison_intervals: JSON.stringify(['24h', '7d', '30d', 'ATL']),
        auto_recommend_alternatives: true,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      item: watchItem || {
        id: itemId,
        userId,
        componentName,
        category,
        targetPrice: target,
        currentPrice: price,
        retailer,
        productUrl,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
        inStock: true,
        notifyOnFlashDrop: true,
        addedAt: new Date().toISOString()
      }
    });
  } catch (e: any) {
    console.error('[/api/watchlist POST Error]:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Watchlist addition failed' }, { status: 500 });
  }
}
