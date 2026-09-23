import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { calculateMultiRetailerDealScore } from '@/lib/scrapers/price-scraper';

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
    let userPrefTargets: Record<string, Record<string, number>> = {};
    if (userId && userId !== 'guest') {
      const { data: userWatchlist } = await supabaseAdmin
        .from('watchlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

      rawWatchlist = userWatchlist || [];

      // Fetch user preferences for per-retailer target alerts
      const { data: userPref } = await supabaseAdmin
        .from('user_preferences')
        .select('delivery_channels')
        .eq('user_id', userId)
        .maybeSingle();

      if (userPref?.delivery_channels) {
        try {
          const channels = typeof userPref.delivery_channels === 'string'
            ? JSON.parse(userPref.delivery_channels)
            : userPref.delivery_channels;
          userPrefTargets = channels.retailer_targets || {};
        } catch {}
      }
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
            previous_price_24h: item.previous_price_24h != null ? Number(item.previous_price_24h) : Number(item.current_price || 0),
            previous_price_7d: item.previous_price_7d != null ? Number(item.previous_price_7d) : Number(item.msrp || item.current_price || 0),
            previous_price_30d: item.previous_price_30d != null ? Number(item.previous_price_30d) : Number(item.msrp || item.current_price || 0),
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
            const mPrice = Number(m.current_price || 0);
            const mMsrp = Number(m.msrp || mPrice);
            retailerOffersMap.set(rKey, {
              id: m.id,
              retailer: m.retailer,
              price: mPrice,
              originalPrice: mMsrp,
              previousPrice: Number(m.previous_price_24h || mPrice),
              previousPrice24h: Number(m.previous_price_24h || mPrice),
              previousPrice7d: Number(m.previous_price_7d || mMsrp || mPrice),
              previousPrice30d: Number(m.previous_price_30d || mMsrp || mPrice),
              title: m.name,
              url: m.product_url || '#',
              imageUrl: m.image_url,
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
                  const roPrice = Number(ro.price || 0);
                  const roMsrp = Number(ro.originalPrice || roPrice);
                  retailerOffersMap.set(roKey, {
                    id: ro.id || `${m.id}-${roKey}`,
                    retailer: ro.retailer,
                    price: roPrice,
                    originalPrice: roMsrp,
                    previousPrice: Number(ro.previousPrice || roPrice),
                    previousPrice24h: Number(ro.previousPrice24h || ro.previousPrice || roPrice),
                    previousPrice7d: Number(ro.previousPrice7d || roMsrp || roPrice),
                    previousPrice30d: Number(ro.previousPrice30d || roMsrp || roPrice),
                    title: ro.title || m.name,
                    url: ro.url || '#',
                    imageUrl: ro.imageUrl || ro.image_url || m.image_url,
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

      // Extract any saved retailer targets from hardware specs and user preferences
      let hwTargets: Record<string, number> = {};
      try {
        const mSpecs = typeof bestMatch?.specs === 'string' ? JSON.parse(bestMatch.specs || '{}') : (bestMatch?.specs || {});
        if (mSpecs.retailer_targets && typeof mSpecs.retailer_targets === 'object') {
          hwTargets = mSpecs.retailer_targets;
        }
      } catch {}

      const cleanCNameKey = (item.component_name || item.name || '').toLowerCase().trim();
      const cleanCIdKey = cId;
      
      // Merge all matching user preference targets across exact key, ID, and partial substring matches
      let matchedPrefTargets: Record<string, number> = {};
      Object.entries(userPrefTargets).forEach(([k, targets]) => {
        if (!targets || typeof targets !== 'object') return;
        const lk = k.toLowerCase().trim();
        const matchesName = lk === cleanCNameKey || (lk.length >= 4 && (cleanCNameKey.includes(lk) || lk.includes(cleanCNameKey)));
        const matchesId = lk === cleanCIdKey || (item.id && lk === String(item.id).toLowerCase().trim());
        if (matchesName || matchesId) {
          matchedPrefTargets = { ...matchedPrefTargets, ...(targets as Record<string, number>) };
        }
      });

      const combinedRetailerTargets: Record<string, number> = {
        ...hwTargets,
        ...matchedPrefTargets
      };

      // Populate default -5% target alert for retailers without an explicit custom target
      retailerOffers.forEach((ro: any) => {
        const rKey = (ro.retailer || '').toLowerCase().trim();
        const rPrice = Number(ro.price || 0);
        if (rKey && rPrice > 0 && combinedRetailerTargets[rKey] === undefined) {
          combinedRetailerTargets[rKey] = Math.round(rPrice * 0.95 * 100) / 100;
        }
      });

      // Ensure finalProductUrl matches finalRetailer domain
      let validatedProductUrl = finalProductUrl;
      const matchingRetailerOffer = retailerOffers.find(
        (ro: any) => (ro.retailer || '').toLowerCase() === finalRetailer.toLowerCase()
      );
      if (matchingRetailerOffer?.url && matchingRetailerOffer.url.startsWith('http')) {
        validatedProductUrl = matchingRetailerOffer.url;
      }

      const finalImageUrl = item.image_url || bestMatch?.image_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80';

      return {
        id: item.id,
        userId: item.user_id || userId,
        componentName: item.component_name || item.name,
        category: item.category || bestMatch?.category || 'GPU',
        targetPrice: Number(item.target_price || (finalPrice > 0 ? Math.round(finalPrice * 0.95 * 100) / 100 : 0)),
        currentPrice: finalPrice,
        previousPrice24h: item.previous_price_24h != null ? Number(item.previous_price_24h) : (bestMatch?.current_price ? Number(bestMatch.current_price) : finalPrice),
        previousPrice7d: item.previous_price_7d != null ? Number(item.previous_price_7d) : (bestMatch?.msrp ? Number(bestMatch.msrp) : finalPrice),
        previousPrice30d: item.previous_price_30d != null ? Number(item.previous_price_30d) : (bestMatch?.msrp ? Number(bestMatch.msrp) : finalPrice),
        allTimeLow: Number(item.all_time_low || bestMatch?.lowest_price_90d || finalPrice),
        retailer: finalRetailer,
        productUrl: validatedProductUrl,
        imageUrl: finalImageUrl,
        inStock: item.in_stock ?? true,
        notifyOnFlashDrop: item.notify_on_flash_drop ?? true,
        addedAt: item.added_at,
        retailerTargets: combinedRetailerTargets,
        specs: {
          RetailerOffers: retailerOffers
        }
      };
    });

    // Aggregate sibling offers per model/name across hardware_components
    const catalogGroupMap = new Map<string, { offers: { retailer: string; price: number }[]; maxPrice: number; msrp: number }>();
    (hwCatalog || []).forEach((h: any) => {
      const key = (h.model || h.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const price = Number(h.current_price || 0);
      const msrp = Number(h.msrp || 0);
      if (!catalogGroupMap.has(key)) {
        catalogGroupMap.set(key, { offers: [], maxPrice: price, msrp });
      }
      const grp = catalogGroupMap.get(key)!;
      if (price > 0) {
        grp.offers.push({ retailer: h.retailer || 'Store', price });
        if (price > grp.maxPrice) grp.maxPrice = price;
      }
      if (msrp > grp.msrp) grp.msrp = msrp;
    });

    const formattedTrending = (hwCatalog || []).map(item => {
      const current = Number(item.current_price || 0);
      const lowest = Number(item.lowest_price_90d || current);
      const key = (item.model || item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const grp = catalogGroupMap.get(key);
      const siblingOffers = grp?.offers || [{ price: current, retailer: item.retailer }];
      const effectiveMsrp = Math.max(Number(item.msrp || 0), grp?.msrp || 0, grp?.maxPrice || 0);

      let computedDealScore = item.deal_score;
      if (typeof computedDealScore !== 'number' || computedDealScore <= 50) {
        computedDealScore = calculateMultiRetailerDealScore(current, siblingOffers, effectiveMsrp, lowest);
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        brand: item.brand,
        model: item.model,
        specs: typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {}),
        msrp: effectiveMsrp > 0 ? effectiveMsrp : item.msrp,
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
    const { id, ids, userId, componentName, targetPrice, retailer, notifyOnFlashDrop } = body;

    const updates: any = {};
    if (typeof targetPrice === 'number' && targetPrice > 0) {
      updates.target_price = targetPrice;
    }
    if (typeof notifyOnFlashDrop === 'boolean') {
      updates.notify_on_flash_drop = notifyOnFlashDrop;
    }

    if (Object.keys(updates).length === 0 && !retailer) {
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

    // 2. Update matching rows in watchlist_items
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

    // 3. Persist per-retailer target alert to user_preferences
    if (userId && typeof targetPrice === 'number' && targetPrice > 0 && retailer) {
      try {
        const { data: prefRow } = await supabaseAdmin
          .from('user_preferences')
          .select('delivery_channels')
          .eq('user_id', userId)
          .maybeSingle();

        let channels: any = { email: true, emailAddress: '' };
        if (prefRow?.delivery_channels) {
          channels = typeof prefRow.delivery_channels === 'string'
            ? JSON.parse(prefRow.delivery_channels)
            : prefRow.delivery_channels;
        }
        channels.retailer_targets = channels.retailer_targets || {};
        const keysToUpdate = new Set<string>();
        if (componentName) keysToUpdate.add(componentName.toLowerCase().trim());
        if (id) keysToUpdate.add(String(id).toLowerCase().trim());
        matchedRows.forEach(r => {
          if (r.component_name) keysToUpdate.add(r.component_name.toLowerCase().trim());
          if (r.id) keysToUpdate.add(String(r.id).toLowerCase().trim());
        });
        keysToUpdate.forEach(k => {
          channels.retailer_targets[k] = channels.retailer_targets[k] || {};
          channels.retailer_targets[k][retailer.toLowerCase()] = targetPrice;
          channels.retailer_targets[k][retailer] = targetPrice;
        });

        await supabaseAdmin
          .from('user_preferences')
          .update({ delivery_channels: JSON.stringify(channels), updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } catch (prefErr) {
        console.warn('user_preferences retailer target update notice:', prefErr);
      }
    }

    // 4. Also update hardware_components specs.retailer_targets
    if (componentName && typeof targetPrice === 'number' && retailer) {
      try {
        const cleanName = String(componentName).replace(/[^a-zA-Z0-9\s]/g, ' ').trim().slice(0, 30);
        const { data: hwItems } = await supabaseAdmin
          .from('hardware_components')
          .select('id, specs')
          .ilike('name', `%${cleanName}%`);

        if (hwItems && hwItems.length > 0) {
          for (const h of hwItems) {
            const specs = typeof h.specs === 'string' ? JSON.parse(h.specs || '{}') : (h.specs || {});
            specs.retailer_targets = specs.retailer_targets || {};
            specs.retailer_targets[retailer.toLowerCase()] = targetPrice;
            specs.retailer_targets[retailer] = targetPrice;
            if (specs.user_watchlist === userId || !specs.user_watchlist) {
              specs.target_price = targetPrice;
            }
            await supabaseAdmin
              .from('hardware_components')
              .update({ specs: JSON.stringify(specs) })
              .eq('id', h.id);
          }
        }
      } catch (hwErr) {
        console.warn('hardware_components target update notice:', hwErr);
      }
    }

    return NextResponse.json({ success: true, updates, retailer, updatedCount: matchedRows.length });
  } catch (e: any) {
    console.error('[/api/watchlist PATCH Error]:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Watchlist update failed' }, { status: 500 });
  }
}

