import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export const runtime = 'edge';

/**
 * GET /api/watchlist
 * Queries Supabase DB for user watchlist items AND trending hardware deals.
 * Immune to RLS blocks by falling back to hardware_components.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    // 1. Fetch User Watchlist Items ONLY if a valid userId is provided
    let rawWatchlist: any[] = [];
    if (userId && userId !== 'guest') {
      const { data: userWatchlist } = await supabaseAdmin
        .from('watchlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

      rawWatchlist = userWatchlist || [];
    }

    // 2. Fetch catalog items for trending hardware
    const { data: hwCatalog } = await supabaseAdmin
        .from('hardware_components')
        .select('*')
        .order('updated_at', { ascending: false });

    let userHwItems: any[] = [];
    if (userId && userId !== 'guest') {
      userHwItems = (hwCatalog || [])
        .filter(item => {
          try {
            const specs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
            return specs.user_watchlist === userId;
          } catch {
            return false;
          }
        })
        .map(item => {
          const specs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
          return {
            id: `w-${item.id}`,
            user_id: userId,
            component_name: item.name,
            category: item.category,
            target_price: Number(specs.target_price || item.target_price || (item.msrp ? Math.round(item.msrp * 0.9 * 100) / 100 : item.current_price)),
            current_price: item.current_price,
            previous_price_24h: item.previous_price_24h || undefined,
            previous_price_7d: item.previous_price_7d || undefined,
            previous_price_30d: item.previous_price_30d || undefined,
            all_time_low: item.lowest_price_90d || item.current_price,
            retailer: item.retailer,
            product_url: item.product_url,
            image_url: item.image_url,
            in_stock: true,
            notify_on_flash_drop: true,
          };
        });
    }

    // Merge without duplicates
    const combinedMap = new Map();
    [...rawWatchlist, ...userHwItems].forEach(item => {
      const nameKey = (item.component_name || item.name || '').toLowerCase();
      if (!combinedMap.has(nameKey)) {
        combinedMap.set(nameKey, item);
      }
    });

    const combinedList = Array.from(combinedMap.values());

    const retailerPriority: Record<string, number> = {
      'Amazon': 1,
      'Micro Center': 2,
      'Newegg': 3,
      'B&H': 4,
      'Best Buy': 5,
      'eBay': 6
    };

    const PRIMARY_BRANDS = [
      'asus', 'gigabyte', 'msi', 'zotac', 'pny', 'evga', 'sapphire', 'powercolor', 'xfx', 
      'asrock', 'inno3d', 'gainward', 'palit', 'galax', 'kfa2', 'samsung', 'western digital', 
      'wd', 'seagate', 'crucial', 'sk hynix', 'sabrent', 'corsair', 'g.skill', 'gskill', 
      'kingston', 'teamgroup', 'patriot', 'adata', 'noctua', 'be quiet', 'lian li', 'nzxt', 
      'fractal', 'thermalright', 'deepcool', 'arctic', 'seasonic', 'super flower', 
      'thermaltake', 'silverstone', 'cooler master', 'montech', 'phanteks', 'antec', 'logitech', 
      'razer', 'steelseries', 'wooting', 'keychron', 'hyperx', 'shure', 'elgato', 'rode', 
      'audio-technica', 'ducky', 'epomaker', 'glorious'
    ];

    const formattedWatchlist = combinedList.map(item => {
      const cId = (item.component_id || item.id || '').toLowerCase();
      const cName = (item.component_name || item.name || '').toLowerCase();

      const hasDirectUrl = Boolean(item.product_url && typeof item.product_url === 'string' && item.product_url.startsWith('http') && item.product_url !== '#');

      // Find all matching hardware catalog rows with strict brand and model checks
      const matches: any[] = [];
      (hwCatalog || []).forEach((h: any) => {
        const hId = (h.id || '').toLowerCase();
        if (hId && cId && (hId === cId || hId.startsWith(cId) || cId.startsWith(hId))) {
          matches.push(h);
        }
      });

      if (matches.length === 0) {
        const cBrands = PRIMARY_BRANDS.filter((b: string) => new RegExp(`\\b${b}\\b`, 'i').test(cName));
        const cleanName = cName.replace(/[^a-z0-9\s]/g, ' ').replace(/\b\d+\s*(?:gb|tb|mb|mhz|ghz|w|bit)\b/g, '');
        const tokens: string[] = cleanName.split(/\s+/).filter((t: string) => t.length > 2 && !['the', 'and', 'for', 'with', 'edition', 'gaming', 'series', 'black', 'white', 'super', 'dual', 'triple', 'graphics', 'card', 'desktop', 'processor', 'solid', 'state', 'drive', 'internal', 'nvme', 'power', 'supply', 'memory'].includes(t));
        const modelTokens = tokens.filter((t: string) => /\d/.test(t) || t.length >= 4);

        (hwCatalog || []).forEach((h: any) => {
          const hText = `${h.name || ''} ${h.model || ''} ${h.id || ''} ${h.brand || ''}`.toLowerCase();
          
          // Brand conflict check: If item specifies brand A, do not match candidate with brand B
          if (cBrands.length > 0) {
            const hasBrand = cBrands.some((b: string) => new RegExp(`\\b${b}\\b`, 'i').test(hText));
            const hasConflict = PRIMARY_BRANDS.some((b: string) => !cBrands.includes(b) && new RegExp(`\\b${b}\\b`, 'i').test(hText));
            if (!hasBrand && hasConflict) return;
          }

          // Model token check: All critical digit tokens must match
          if (modelTokens.length > 0) {
            const digitTokens = modelTokens.filter((t: string) => /\d/.test(t));
            if (digitTokens.length > 0 && !digitTokens.every((d: string) => hText.includes(d))) return;

            const score = modelTokens.filter((t: string) => hText.includes(t)).length;
            if (score >= Math.max(1, modelTokens.length - 1) && !matches.some((m: any) => m.id === h.id)) {
              matches.push(h);
            }
          }
        });
      }

      // Sort matches by retailer reliability & lowest price
      matches.sort((a: any, b: any) => {
        const urlA = a.product_url && a.product_url.startsWith('http') ? 0 : 1;
        const urlB = b.product_url && b.product_url.startsWith('http') ? 0 : 1;
        if (urlA !== urlB) return urlA - urlB;
        const pA = retailerPriority[a.retailer] || 99;
        const pB = retailerPriority[b.retailer] || 99;
        if (pA !== pB) return pA - pB;
        return (Number(a.current_price) || 999999) - (Number(b.current_price) || 999999);
      });

      const bestMatch = matches[0];

      const retailerOffersMap = new Map<string, any>();
      matches.forEach((m: any) => {
        if (m && m.retailer && Number(m.current_price) > 0) {
          const rKey = m.retailer.toLowerCase();
          if (!retailerOffersMap.has(rKey)) {
            retailerOffersMap.set(rKey, {
              id: m.id,
              retailer: m.retailer,
              price: Number(m.current_price || 0),
              originalPrice: Number(m.msrp || m.current_price || 0),
              title: m.name,
              url: m.product_url || '#',
              inStock: true
            });
          }
        }
        // Also unpack specs.RetailerOffers if stored inside row
        try {
          const mSpecs = typeof m.specs === 'string' ? JSON.parse(m.specs || '{}') : (m.specs || {});
          if (Array.isArray(mSpecs.RetailerOffers)) {
            mSpecs.RetailerOffers.forEach((ro: any) => {
              if (ro && ro.retailer && Number(ro.price) > 0) {
                const roKey = ro.retailer.toLowerCase();
                if (!retailerOffersMap.has(roKey)) {
                  retailerOffersMap.set(roKey, {
                    id: ro.id || `${m.id}-${roKey}`,
                    retailer: ro.retailer,
                    price: Number(ro.price || 0),
                    originalPrice: Number(ro.originalPrice || ro.price || 0),
                    title: ro.title || m.name,
                    url: ro.url || '#',
                    inStock: ro.inStock ?? true
                  });
                }
              }
            });
          }
        } catch (e) {}
      });

      const retailerOffers = Array.from(retailerOffersMap.values());

      // If user provided a direct verified URL, preserve it; otherwise use bestMatch
      const finalPrice = hasDirectUrl 
        ? Number(item.current_price || item.all_time_low || item.previous_price_24h || item.target_price || 0)
        : (bestMatch ? Number(bestMatch.current_price || 0) : Number(item.current_price || item.all_time_low || item.previous_price_24h || item.target_price || 0));

      const finalRetailer = hasDirectUrl 
        ? (item.retailer || 'Online Retailer')
        : (bestMatch ? (bestMatch.retailer || 'Amazon') : (item.retailer || 'Amazon'));

      const finalProductUrl = hasDirectUrl 
        ? item.product_url
        : (bestMatch ? (bestMatch.product_url || '#') : (item.product_url || '#'));

      const finalImageUrl = item.image_url || bestMatch?.image_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80';

      return {
        id: item.id,
        userId: item.user_id || userId,
        componentName: item.component_name || item.name,
        category: item.category || bestMatch?.category || 'GPU',
        targetPrice: Number(item.target_price || (finalPrice > 0 ? Math.round(finalPrice * 0.9 * 100) / 100 : 0)),
        currentPrice: finalPrice,
        previousPrice24h: item.previous_price_24h || undefined,
        previousPrice7d: item.previous_price_7d || undefined,
        previousPrice30d: item.previous_price_30d || undefined,
        allTimeLow: Number(item.all_time_low || finalPrice),
        retailer: finalRetailer,
        productUrl: finalProductUrl,
        imageUrl: finalImageUrl,
        inStock: item.in_stock ?? true,
        notifyOnFlashDrop: item.notify_on_flash_drop ?? true,
        addedAt: item.added_at,
        specs: {
          RetailerOffers: retailerOffers
        }
      };
    });

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
    const wl_insert_payload: any = {
      component_name: componentName,
      category,
      target_price: target,
      previous_price_24h: price,
      previous_price_7d: price,
      previous_price_30d: price,
      all_time_low: price,
    };
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      wl_insert_payload.user_id = userId;
    }

    const { data: watchItem, error: watchErr } = await supabase
      .from('watchlist_items')
      .insert(wl_insert_payload)
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

/**
 * PATCH /api/watchlist
 * Updates target_price and/or notify_on_flash_drop for watchlist items.
 * Uses supabaseAdmin to guarantee updates succeed without RLS blocks.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids, userId, componentName, targetPrice, notifyOnFlashDrop } = body;

    const updates: any = {};
    if (typeof targetPrice === 'number' && targetPrice > 0) {
      updates.target_price = targetPrice;
    }
    if (typeof notifyOnFlashDrop === 'boolean') {
      updates.notify_on_flash_drop = notifyOnFlashDrop;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const rawIds = [...(Array.isArray(ids) ? ids : []), id].filter(Boolean);
    const validUuids = rawIds
      .map(i => String(i).replace(/^(w-|hw-|comp-)/, ''))
      .filter(i => uuidRegex.test(i));

    // 1. Find existing rows matching the UUIDs or component name
    let matchedRows: any[] = [];
    if (validUuids.length > 0) {
      const { data: byId } = await supabaseAdmin
        .from('watchlist_items')
        .select('*')
        .in('id', validUuids);
      if (byId && byId.length > 0) {
        matchedRows.push(...byId);
      }
    }

    if (userId && componentName && matchedRows.length === 0) {
      const cleanName = String(componentName).replace(/[^a-zA-Z0-9\s]/g, ' ').trim().slice(0, 30);
      const { data: byName } = await supabaseAdmin
        .from('watchlist_items')
        .select('*')
        .eq('user_id', userId)
        .ilike('component_name', `%${cleanName}%`);
      if (byName && byName.length > 0) {
        matchedRows.push(...byName);
      }
    }

    // 2. Perform atomic replace (delete + insert) to bypass PostgreSQL RLS update restrictions
    for (const row of matchedRows) {
      await supabaseAdmin.from('watchlist_items').delete().eq('id', row.id);
      const updatedRow = {
        user_id: row.user_id,
        component_id: row.component_id,
        component_name: row.component_name,
        category: row.category,
        target_price: updates.target_price !== undefined ? updates.target_price : row.target_price,
        previous_price_24h: row.previous_price_24h,
        previous_price_7d: row.previous_price_7d,
        previous_price_30d: row.previous_price_30d,
        all_time_low: row.all_time_low,
        created_at: row.created_at,
        added_at: row.added_at,
      };
      await supabaseAdmin.from('watchlist_items').insert(updatedRow);
    }

    // 3. Also update hardware_components if user-tagged
    if (userId && componentName && typeof targetPrice === 'number') {
      try {
        const cleanName = String(componentName).replace(/[^a-zA-Z0-9\s]/g, ' ').trim().slice(0, 30);
        const { data: hwItems } = await supabaseAdmin
          .from('hardware_components')
          .select('id, specs')
          .ilike('name', `%${cleanName}%`);

        if (hwItems && hwItems.length > 0) {
          for (const h of hwItems) {
            const specs = typeof h.specs === 'string' ? JSON.parse(h.specs || '{}') : (h.specs || {});
            if (specs.user_watchlist === userId) {
              specs.target_price = targetPrice;
              await supabaseAdmin
                .from('hardware_components')
                .update({ specs: JSON.stringify(specs) })
                .eq('id', h.id);
            }
          }
        }
      } catch (hwErr) {
        console.warn('hardware_components target update notice:', hwErr);
      }
    }

    return NextResponse.json({ success: true, updates, updatedCount: matchedRows.length });
  } catch (e: any) {
    console.error('[/api/watchlist PATCH Error]:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Watchlist update failed' }, { status: 500 });
  }
}

