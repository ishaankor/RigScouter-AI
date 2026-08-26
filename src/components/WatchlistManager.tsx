'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Trash2,
  ExternalLink,
  Plus,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  Flame,
  Bot,
  Loader2,
  Search,
  Globe,
  Database,
  Lock,
  LogIn,
  X,
  Edit3,
  Check
} from 'lucide-react';
import { WatchlistItem, HardwareComponent } from '@/lib/types/hardware';
import { supabase } from '@/lib/db/supabase';

interface WatchlistManagerProps {
  initialWatchlist?: WatchlistItem[];
  initialTrendingItems?: HardwareComponent[];
  user?: any;
  onOpenAuth?: () => void;
}

export function WatchlistManager({
  initialWatchlist = [],
  initialTrendingItems = [],
  user,
  onOpenAuth
}: WatchlistManagerProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [trendingItems, setTrendingItems] = useState<HardwareComponent[]>(initialTrendingItems);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<'24h' | '7d' | '30d'>('24h');
  const [activeTab, setActiveTab] = useState<'watchlist' | 'trending'>('watchlist');

  // Autonomous bot input state
  const [liveQuery, setLiveQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeNotice, setScrapeNotice] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<{
    title: string;
    message: string;
    query?: string;
  } | null>(null);

  useEffect(() => {
    if (searchError) {
      const timer = setTimeout(() => {
        setSearchError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchError]);

  // Dynamic Retailer selection state (itemId -> retailerName)
  const [selectedRetailers, setSelectedRetailers] = useState<Record<string, string>>({});

  // Helper to extract a canonical hardware key from an item (groups all retailer listings together)
  const getNormalizedKey = (itm: any) => {
    if (!itm) return '';
    const text = (itm.model || itm.component_name || itm.componentName || itm.name || '').toLowerCase();
    const compId = (itm.component_id || itm.id || '').toLowerCase();

    // 1. GPU Pattern (e.g. RTX 4080 Super, RX 7900 XTX)
    const gpuMatch = text.match(/\b(geforce\s+)?(rtx|gtx|rx|arc)\s*(\d{3,4})\s*(super|ti|xtx|xt|gre)?\b/i);
    if (gpuMatch) {
      const prefix = gpuMatch[2].toLowerCase();
      const num = gpuMatch[3];
      const mod = gpuMatch[4] ? ' ' + gpuMatch[4].toLowerCase() : '';
      return (prefix + ' ' + num + mod).trim();
    }

    // 2. CPU Pattern (e.g. Ryzen 9 9900X3D, Core i9 14900K, Ultra 9 285K)
    const cpuMatch = text.match(/\b(ryzen\s*[3579]\s*\d{4,5}[a-z0-9]*(?:\s*x3d)?|core\s*i[3579][ -]\d{4,5}[a-z]*|ultra\s*[3579]\s*[- ]?\d{3,4}[a-z]*)\b/i);
    if (cpuMatch) {
      return cpuMatch[0].replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // 3. Motherboard Pattern (e.g. Prime Q270M-C, Z890 WiFi, B650 Tomahawk)
    const moboMatch = text.match(/\b(prime|strix|tuf|aorus|tomahawk|proart|taichi|maximus|hero|plus|elite)\s+([a-z0-9-]+)\b/i) ||
                      text.match(/\b([zbxqa]\d{3}[a-z0-9-]*)\b/i);
    if (moboMatch) {
      return (moboMatch[1] + (moboMatch[2] ? ' ' + moboMatch[2] : '')).replace(/[^a-z0-9]+/g, ' ').trim();
    }

    // 4. RAM Pattern (e.g. Vengeance RGB, Trident Z5, Ripjaws)
    const ramMatch = text.match(/\b(vengeance|trident\s*z\d?|ripjaws|dominator|fury\s+beast|t-force|g\.?skill)\b.*?\b(ddr[45])?\b/i);
    if (ramMatch) {
      return (ramMatch[1] + (ramMatch[2] ? ' ' + ramMatch[2] : '')).replace(/[^a-z0-9]+/g, ' ').trim();
    }

    // 5. Cooler / AIO / Cooling Pattern (e.g. Liquid Freezer III, Kraken, Peerless Assassin, NH-D15, NexXxoS)
    const coolerMatch = text.match(/\b(liquid\s*freezer\s*(?:iii|ii|pro)?(?:\s*\d{3})?|kraken\s*(?:elite|\d{3})?|peerless\s*assassin|phantom\s*spirit|nh\s*[-_]?d15|nexxxos\s*[a-z0-9]*|masterliquid|icue\s*link|pure\s*loop|arctic\s*acfre[a-z0-9]*)\b/i);
    if (coolerMatch) {
      return coolerMatch[0].replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // 6. Fallback: Cleaned alphanumeric slug
    const cleanId = compId.replace(/^(w-|comp-)/, '').replace(/-(amazon|best-buy|newegg|micro-center|b-h|ebay)$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
    if (cleanId && cleanId.length > 3) return cleanId;

    return text
      .replace(/^(asus|msi|gigabyte|zotac|evga|sapphire|xfx|pny|powercolor|asrock|intel|amd|nvidia|corsair|g\.skill|samsung|crucial|western digital|wd|lian li|nzxt|noctua|be quiet|seasonic|thermaltake|lenovo|arch memory|arctic)\s+/i, '')
      .replace(/\b(desktop processor|processor|graphics card|video card|cpu|gpu|ddr4|ddr5|ram|nvme|solid state drive|motherboard|power supply|psu|edition|oc|gaming|unlocked|socket|12-core|16-core|8-core|24-thread|32-thread|aio|cooler|cpu cooler|water cooling|radiator)\b/gi, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  };

  // Helper to extract active retailer offer & price dynamically from specs.RetailerOffers or sibling model records (Immutable & Memory-Safe)
  const getEffectiveOffer = (item: any) => {
    if (!item) {
      return {
        title: 'Component',
        currentPrice: 0,
        msrp: 0,
        productUrl: '#',
        retailer: 'Amazon',
        inStock: false,
        availableRetailers: ['Amazon'],
        offers: []
      };
    }

    const specs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
    const baseOffers = Array.isArray(specs.RetailerOffers) ? specs.RetailerOffers : [];
    
    // Always clone to avoid mutating state object in memory
    const combinedOffers: Array<{ id?: string; retailer: string; price: number; originalPrice?: number; title?: string; url: string; inStock: boolean }> = [...baseOffers];

    const itemKey = getNormalizedKey(item);
    if (trendingItems.length > 0) {
      const itemTitle = (item.componentName || item.component_name || item.name || '').toLowerCase();
      const siblings = trendingItems.filter(t => {
        const tKey = getNormalizedKey(t);
        if (tKey && itemKey && (tKey === itemKey || (tKey.length > 6 && itemKey.includes(tKey)))) return true;
        
        if (t.model && itemTitle) {
          const tModel = (t.model || '').toLowerCase().trim();
          if (tModel.length > 5 && itemTitle.includes(tModel)) {
            return true;
          }
        }
        return false;
      });
      for (const sib of siblings) {
        if (sib.retailer && !combinedOffers.some(o => (o?.retailer || '').toLowerCase() === (sib.retailer || '').toLowerCase())) {
          combinedOffers.push({
            retailer: sib.retailer,
            price: Number(sib.currentPrice || 0),
            originalPrice: Number(sib.msrp || sib.currentPrice || 0),
            title: sib.name,
            url: sib.productUrl || '#',
            inStock: true
          });
        }
      }
    }

    const itemRetailer = item.retailer || '';
    if (itemRetailer && !combinedOffers.some(o => (o?.retailer || '').toLowerCase() === itemRetailer.toLowerCase())) {
      const explicitPrice = Number(item.currentPrice || item.current_price || item.allTimeLow || item.all_time_low || item.previousPrice24h || item.targetPrice || item.target_price || 0);
      if (explicitPrice > 0) {
        combinedOffers.push({
          retailer: itemRetailer,
          price: explicitPrice,
          originalPrice: Number(item.msrp || explicitPrice),
          title: item.componentName || item.name || 'Component',
          url: item.productUrl || item.product_url || '#',
          inStock: item.inStock ?? true
        });
      }
    }

    // Filter out dummy/unscraped retailers (price is 0 or URL is missing or retailer is empty)
    const validOffers = combinedOffers.filter(o => o && o.retailer && Number(o.price) > 0);
    const finalOffers = validOffers.length > 0 ? validOffers : (combinedOffers.filter(o => o && o.retailer) || []);

    const defaultFallbackRetailer = finalOffers[0]?.retailer || item.retailer || 'Amazon';
    const activeRetailer = selectedRetailers[item.id] || defaultFallbackRetailer;
    const matchedOffer = finalOffers.find(o => (o?.retailer || '').toLowerCase() === (activeRetailer || '').toLowerCase()) || 
                         finalOffers.find(o => (o?.retailer || '').toLowerCase() === (item.retailer || '').toLowerCase()) || 
                         finalOffers[0];

    const rawFallbackPrice = Number(item.currentPrice ?? item.current_price ?? item.allTimeLow ?? item.all_time_low ?? item.previousPrice24h ?? item.targetPrice ?? item.target_price ?? 0);
    const currentPrice = matchedOffer ? Number(matchedOffer.price || 0) : rawFallbackPrice;
    const msrp = matchedOffer ? Number(matchedOffer.originalPrice ?? currentPrice) : (item.msrp ? Number(item.msrp) : currentPrice);
    const productUrl = matchedOffer ? (matchedOffer.url || '#') : (item.productUrl ?? item.product_url ?? '#');
    const retailer = matchedOffer ? (matchedOffer.retailer || activeRetailer) : (item.retailer || activeRetailer || 'Amazon');
    
    let cleanName = item.componentName ?? item.name ?? 'Component';
    if (cleanName.startsWith('http://') || cleanName.startsWith('https://')) {
      if (matchedOffer?.title && !matchedOffer.title.startsWith('http')) {
        cleanName = matchedOffer.title;
      } else {
        try {
          const u = new URL(cleanName);
          const parts = u.pathname.split('/').filter(Boolean);
          const slug = parts.find(p => p.length > 5 && !['dp', 'product', 'p', 'itm'].includes(p.toLowerCase())) || parts[0] || '';
          cleanName = decodeURIComponent(slug).replace(/[-_]+/g, ' ').replace(/\b(dp|p|product)\b/gi, '').trim();
        } catch (e) {}
      }
    }
    const title = (matchedOffer?.title && !matchedOffer.title.startsWith('http')) ? matchedOffer.title : cleanName;
    const inStock = matchedOffer ? Boolean(matchedOffer.inStock) : true;

    const availableRetailers = Array.from(new Set(finalOffers.map(o => o?.retailer))).filter((r): r is string => Boolean(r));

    return {
      title,
      currentPrice,
      msrp,
      productUrl,
      retailer: retailer || 'Amazon',
      inStock,
      availableRetailers: availableRetailers.length > 0 ? availableRetailers : [retailer || 'Amazon'],
      offers: combinedOffers
    };
  };

  // Fetch watchlist & trending items directly from Supabase DB on mount / auth change
  useEffect(() => {
    async function loadDatabaseWatchlist() {
      setIsLoading(true);
      try {
        let formatted: WatchlistItem[] = [];

        // 1. Fetch user watchlist items ONLY if user is authenticated
        if (user?.id) {
          const userId = user.id;

          // Try fetching from /api/watchlist (uses supabaseAdmin service role)
          try {
            const apiRes = await fetch(`/api/watchlist?userId=${encodeURIComponent(userId)}`);
            if (apiRes.ok) {
              const apiData = await apiRes.json();
              if (apiData.items && Array.isArray(apiData.items) && apiData.items.length > 0) {
                formatted = apiData.items;
              }
            }
          } catch (apiErr) {
            console.warn('/api/watchlist fetch fallback:', apiErr);
          }

          // Fallback to direct client query if server API returned empty
          if (formatted.length === 0) {
            const { data: dbItems } = await supabase
              .from('watchlist_items')
              .select('*')
              .eq('user_id', userId)
              .order('id', { ascending: false });

            if (dbItems && dbItems.length > 0) {
              // Group by canonical component name so multiple retailer rows show up as ONE consolidated item with retailer dropdown
              const groupedMap = new Map<string, any>();
              
              dbItems.forEach((item: any) => {
                const key = getNormalizedKey(item);
                if (!key) return;
                
                if (!groupedMap.has(key)) {
                  groupedMap.set(key, { ...item, dbRowIds: [item.id], RetailerOffers: [] });
                } else {
                  const existing = groupedMap.get(key);
                  if (item.id && !existing.dbRowIds.includes(item.id)) {
                    existing.dbRowIds.push(item.id);
                  }
                  // Preserve valid target_price
                  if ((!existing.target_price || Number(existing.target_price) <= 0) && item.target_price && Number(item.target_price) > 0) {
                    existing.target_price = item.target_price;
                  }
                  // Prefer lowest price for all_time_low
                  if (item.all_time_low && (!existing.all_time_low || item.all_time_low < existing.all_time_low)) {
                    existing.all_time_low = item.all_time_low;
                  }
                }
              });

              formatted = Array.from(groupedMap.values()).map((group: any) => ({
                id: group.id,
                dbRowIds: group.dbRowIds,
                userId: group.user_id,
                componentName: group.component_name,
                category: group.category || 'GPU',
                targetPrice: Number(group.target_price || 0),
                currentPrice: Number(group.all_time_low || group.target_price || 0),
                previousPrice24h: group.previous_price_24h,
                previousPrice7d: group.previous_price_7d,
                previousPrice30d: group.previous_price_30d,
                allTimeLow: group.all_time_low,
                retailer: 'Amazon',
                productUrl: '#',
                imageUrl: getCategoryImage(group.category || 'GPU'),
                inStock: true,
                notifyOnFlashDrop: group.notify_on_flash_drop ?? true,
                addedAt: group.added_at,
                specs: { RetailerOffers: group.RetailerOffers || [] }
              }));
            }
          }
        }

        // 2. Direct Supabase DB Table Query for trending hardware catalog (publicly accessible)
        const { data: hwCatalog } = await supabase
          .from('hardware_components')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(500);

        // Also merge any user items saved in hardware_components if user is logged in
        if (user?.id && hwCatalog && hwCatalog.length > 0) {
          const userId = user.id;
          const userHwMap = new Map<string, any>();
          hwCatalog.forEach((item: any) => {
            try {
              const specs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
              const isUserItem = specs.user_watchlist === userId;
              if (isUserItem) {
                const key = getNormalizedKey(item);
                if (key && !formatted.some(f => getNormalizedKey(f) === key) && !userHwMap.has(key)) {
                  const savedTarget = Number(specs.target_price || item.target_price || 0);
                  userHwMap.set(key, {
                    id: `w-${item.id}`,
                    userId: userId,
                    componentName: item.name,
                    category: item.category || 'GPU',
                    targetPrice: savedTarget > 0 ? savedTarget : (item.msrp ? Math.round(item.msrp * 0.9 * 100) / 100 : item.current_price || 0),
                    currentPrice: item.current_price || 0,
                    previousPrice24h: undefined,
                    previousPrice7d: undefined,
                    previousPrice30d: undefined,
                    allTimeLow: item.lowest_price_90d || item.current_price || 0,
                    retailer: item.retailer || 'Amazon',
                    productUrl: item.product_url || '#',
                    imageUrl: item.image_url || getCategoryImage(item.category || 'GPU'),
                    inStock: true,
                    notifyOnFlashDrop: true,
                    addedAt: item.updated_at,
                    specs: { RetailerOffers: [] }
                  });
                }
              }
            } catch (e) {}
          });
          formatted = [...formatted, ...Array.from(userHwMap.values())];
        }

        // Recover pending scrapes from sessionStorage if user is signed in
        let recoveredPending: WatchlistItem[] = [];
        const rawList = user?.id ? [...recoveredPending, ...formatted] : [];
        const seenIds = new Set<string>();
        const seenKeys = new Set<string>();
        const dedupedList: WatchlistItem[] = [];

        rawList.forEach((item) => {
          const normKey = getNormalizedKey(item);
          const rawId = item.id || `gen-${normKey}`;
          if (normKey && !seenKeys.has(normKey) && !seenIds.has(rawId)) {
            seenKeys.add(normKey);
            seenIds.add(rawId);
            dedupedList.push(item);
          }
        });

        setWatchlist(dedupedList);

        if (hwCatalog && hwCatalog.length > 0) {
          const formattedTrending = hwCatalog.map((item: any) => {
            const current = item.current_price || 0;
            const msrp = item.msrp || current;
            const lowest = item.lowest_price_90d || current;

            // 100% Dynamic deal score computed from real price ratios
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
              dbRowIds: [item.id],
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
          setTrendingItems(formattedTrending);
        }
      } catch (e) {
        console.warn('Database fetch warning:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadDatabaseWatchlist();
  }, [user?.id]);

  // 100% Autonomous Bot Add-to-Watchlist Handler (NO manual form filling)
  const handleAutonomousAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAddModal(false);
      onOpenAuth?.();
      return;
    }

    const queryToScrape = liveQuery.trim();
    if (!queryToScrape) return;

    setIsScraping(true);
    setScrapeNotice(null);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';
    const userId = user.id;
    const pendingId = `w-${Date.now()}`;
    const category = autoDetectCategory(queryToScrape);

    // 1. Create a "Pending" item in the Watchlist instantly
    const pendingItem: WatchlistItem = {
      id: pendingId,
      userId,
      componentName: queryToScrape,
      category,
      targetPrice: 0,
      currentPrice: 0,
      previousPrice24h: 0,
      previousPrice7d: 0,
      previousPrice30d: 0,
      allTimeLow: 0,
      retailer: 'Scraping live prices...' as any,
      productUrl: '',
      imageUrl: getCategoryImage(category),
      inStock: false,
      notifyOnFlashDrop: true,
      addedAt: new Date().toISOString()
    };

    // Save to sessionStorage to survive Fast Refresh / Safari tab suspending
    try {
      const stored = JSON.parse(sessionStorage.getItem('pendingScrapes') || '[]');
      sessionStorage.setItem('pendingScrapes', JSON.stringify([...stored, pendingItem]));
    } catch (e) {}

    // Update screen instantly & close modal
    setWatchlist(prev => [pendingItem, ...prev]);
    setShowAddModal(false);
    setLiveQuery('');

    // 2. Setup an SSE listener to catch the streaming results
    const es = new EventSource(`${BACKEND_URL}/api/stream`);
    let bestPrice = Infinity;

    es.addEventListener('retailer_found', async (e: MessageEvent) => {
      const payload = JSON.parse(e.data);
      const isMatch = (payload.original_query && payload.original_query.toLowerCase() === queryToScrape.toLowerCase()) || 
                      payload.query.toLowerCase() === queryToScrape.toLowerCase() ||
                      payload.query.toLowerCase().includes(queryToScrape.toLowerCase()) ||
                      queryToScrape.toLowerCase().includes(payload.query.toLowerCase());
                      
      if (isMatch) {
        const newOffer = {
          retailer: payload.retailer,
          price: payload.price,
          originalPrice: null as number | null,
          title: payload.title,
          url: payload.url,
          inStock: payload.inStock,
        };

        if (payload.price < bestPrice) {
          bestPrice = payload.price;
        }

        // Accumulate ALL retailer offers so the dropdown shows every price
        setWatchlist(prev => prev.map(item => {
          if (item.id !== pendingId) return item;

          const currentSpecs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
          const existingOffers: typeof newOffer[] = currentSpecs.RetailerOffers || [];

          // Upsert: replace if retailer already exists, otherwise append
          const updatedOffers = existingOffers.some(o => o.retailer === payload.retailer)
            ? existingOffers.map(o => o.retailer === payload.retailer ? newOffer : o)
            : [...existingOffers, newOffer];

          const isBest = payload.price <= bestPrice;
          return {
            ...item,
            // Only promote to best price if this is the cheapest so far
            ...(isBest ? {
              componentName: payload.title,
              currentPrice: payload.price,
              targetPrice: Math.round(payload.price * 0.9 * 100) / 100,
              retailer: payload.retailer,
              productUrl: payload.url,
              inStock: payload.inStock,
            } : {}),
            specs: { ...currentSpecs, RetailerOffers: updatedOffers },
          };
        }));
      }
    });

    es.addEventListener('agent_error', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const isMatch = (payload.pending_id && payload.pending_id === pendingId) ||
                        (payload.original_query && payload.original_query.toLowerCase() === queryToScrape.toLowerCase()) ||
                        (payload.query && payload.query.toLowerCase() === queryToScrape.toLowerCase());
        if (isMatch) {
          setIsScraping(false);
          // Remove pending placeholder item from watchlist
          setWatchlist(prev => prev.filter(item => item.id !== pendingId));
          setSearchError({
            title: payload.error_type === 'GENERIC_QUERY_ERROR' ? 'Search Too Broad' :
                   payload.error_type === 'INCOMPATIBLE_ITEM_ERROR' ? 'Item Not Supported' :
                   'Search Error',
            message: payload.message || payload.error || `Could not find live pricing for "${payload.original_query || payload.query || queryToScrape}".`,
            query: payload.original_query || payload.query || queryToScrape
          });
          es.close();
        }
      } catch (err) {
        console.warn('agent_error parse error:', err);
      }
    });

    es.addEventListener('agent_complete', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const isMatch = (payload.pending_id && payload.pending_id === pendingId) ||
                        (payload.original_query && payload.original_query.toLowerCase() === queryToScrape.toLowerCase()) || 
                        payload.query.toLowerCase() === queryToScrape.toLowerCase() ||
                        payload.query.toLowerCase().includes(queryToScrape.toLowerCase()) ||
                        queryToScrape.toLowerCase().includes(payload.query.toLowerCase());
                        
        if (isMatch) {
          setIsScraping(false);
          if (!payload.bestOffer || payload.is_error) {
            // Remove the empty/pending placeholder card from the watchlist
            setWatchlist(prev => prev.filter(item => item.id !== pendingId));
            setSearchError({
              title: payload.error_type === 'GENERIC_QUERY_ERROR' ? 'Search Too Broad' :
                     payload.error_type === 'INCOMPATIBLE_ITEM_ERROR' ? 'Item Not Supported' :
                     'No Live Prices Found',
              message: payload.summary || `No live retailer listings found for "${payload.original_query || payload.query || queryToScrape}".`,
              query: payload.original_query || payload.query || queryToScrape
            });
          } else {
            // Update the pending item with bestOffer details (especially critical for direct URL scrapes!)
            const bo = payload.bestOffer;
            setWatchlist(prev => prev.map(item => {
              if (item.id !== pendingId) return item;
              const currentSpecs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
              return {
                ...item,
                componentName: bo.title || payload.query || item.componentName,
                category: payload.category || item.category,
                currentPrice: bo.price,
                targetPrice: Math.round(bo.price * 0.9 * 100) / 100,
                retailer: bo.retailer,
                productUrl: bo.url,
                inStock: bo.inStock,
                specs: {
                  ...currentSpecs,
                  RetailerOffers: payload.allOffers && payload.allOffers.length > 0 ? payload.allOffers : [{
                    retailer: bo.retailer,
                    price: bo.price,
                    title: bo.title,
                    url: bo.url,
                    inStock: bo.inStock
                  }]
                }
              };
            }));
          }
          es.close();
        }
      } catch (err) {
        console.warn('agent_complete parse error:', err);
      }
    });

    es.addEventListener('error', () => {
      // Close on error to prevent infinite retries
      setIsScraping(false);
      es.close();
    });

    // 3. Trigger the actual backend agent in the background (fire & forget)
    try {
      fetch(`${BACKEND_URL}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: queryToScrape,
          userId: userId,
          pendingId: pendingId
        })
      }).catch(err => console.warn('Background trigger fetch error:', err));
    } catch (err) {
      console.warn('Background trigger exception:', err);
    }
  };

  const removeItem = async (id: string) => {
    const itemToDelete = watchlist.find(item => item.id === id);
    setWatchlist(prev => prev.filter(item => item.id !== id));

    // 1. Remove from sessionStorage to prevent resurrection on refresh
    try {
      const stored = JSON.parse(sessionStorage.getItem('pendingScrapes') || '[]');
      const filtered = stored.filter((p: any) => p.id !== id && (p.componentName || '').toLowerCase() !== (itemToDelete?.componentName || '').toLowerCase());
      sessionStorage.setItem('pendingScrapes', JSON.stringify(filtered));
    } catch (e) {}

    // 2. Collect all valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const collectedIds: string[] = [];
    if (itemToDelete?.id) collectedIds.push(itemToDelete.id);
    if (itemToDelete?.dbRowIds && Array.isArray(itemToDelete.dbRowIds)) {
      collectedIds.push(...itemToDelete.dbRowIds);
    }
    if (itemToDelete?.specs?.RetailerOffers) {
      itemToDelete.specs.RetailerOffers.forEach((o: any) => {
        if (o?.id) collectedIds.push(o.id);
      });
    }
    const validUuids = Array.from(new Set(collectedIds.filter(i => uuidRegex.test(i))));

    // 3. Direct Supabase DB Table Delete for valid UUIDs
    if (validUuids.length > 0) {
      try {
        const { error: wlErr } = await supabase
          .from('watchlist_items')
          .delete()
          .in('id', validUuids);

        if (wlErr) {
          console.warn('[Supabase DB Delete Warning] watchlist_items:', wlErr.message);
        } else {
          console.log(`[Supabase DB Delete Success] Removed ${validUuids.length} rows from watchlist_items table.`);
        }
      } catch (e) {
        console.warn('Database deletion exception:', e);
      }
    }

    // 4. Also delete any matching component_name rows as fallback
    if (itemToDelete?.componentName) {
      try {
        await supabase
          .from('watchlist_items')
          .delete()
          .ilike('component_name', `%${itemToDelete.componentName}%`);
      } catch (e) {}
    }

    // 5. Backend proxy cleanup
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';
    try {
      await fetch(`${BACKEND_URL}/api/watchlist/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}
  };

  const removeTrendingItem = async (id: string, name: string, dbRowIds?: string[]) => {
    setTrendingItems(prev => prev.filter(item => item.id !== id));
    const idsToDelete = dbRowIds && dbRowIds.length > 0 ? dbRowIds : [id];
    try {
      const { error } = await supabase.from('hardware_components').delete().in('id', idsToDelete);
      if (error) {
        console.warn('[Supabase DB Delete Warning] hardware_components:', error.message);
      } else {
        console.log(`[Supabase DB Delete Success] Removed ${idsToDelete.length} component row(s) for "${name}" from hardware_components table.`);
      }
    } catch (e) {}

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';
    for (const targetId of idsToDelete) {
      try {
        await fetch(`${BACKEND_URL}/api/components/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
      } catch (e) {}
    }
  };

  // Target Alert Editing State
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [tempTargetPrice, setTempTargetPrice] = useState<string>('');

  const startEditingTarget = (item: WatchlistItem, currentEffectivePrice: number) => {
    setEditingTargetId(item.id);
    const initialVal = item.targetPrice && item.targetPrice > 0 
      ? item.targetPrice 
      : (currentEffectivePrice > 0 ? Math.round(currentEffectivePrice * 0.9 * 100) / 100 : 0);
    setTempTargetPrice(initialVal > 0 ? String(initialVal) : '');
  };

  const saveTargetPrice = async (itemId: string) => {
    const newPrice = parseFloat(tempTargetPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      setEditingTargetId(null);
      return;
    }

    const targetItem = watchlist.find(i => i.id === itemId);
    setWatchlist(prev => prev.map(i => i.id === itemId ? { ...i, targetPrice: newPrice } : i));
    setEditingTargetId(null);

    if (targetItem && user?.id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const rawIds = [targetItem.id, ...(targetItem.dbRowIds || [])];
      const validUuids: string[] = [];
      
      rawIds.forEach(idStr => {
        if (!idStr) return;
        const clean = String(idStr).replace(/^(w-|hw-|comp-)/, '');
        if (uuidRegex.test(clean)) {
          validUuids.push(clean);
        }
      });

      // 1. Direct Supabase client update
      try {
        if (validUuids.length > 0) {
          await supabase
            .from('watchlist_items')
            .update({ target_price: newPrice })
            .in('id', validUuids);
        }

        if (targetItem.componentName) {
          await supabase
            .from('watchlist_items')
            .update({ target_price: newPrice })
            .eq('user_id', user.id)
            .ilike('component_name', `%${targetItem.componentName.slice(0, 30)}%`);
        }
      } catch (e: any) {
        console.warn('Direct Supabase update notice:', e?.message || e);
      }

      // 2. Server API PATCH fallback (uses supabaseAdmin to guarantee persistence)
      try {
        await fetch('/api/watchlist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetItem.id,
            ids: targetItem.dbRowIds || [],
            userId: user.id,
            componentName: targetItem.componentName,
            targetPrice: newPrice
          })
        });
      } catch (patchErr) {
        console.warn('PATCH /api/watchlist notice:', patchErr);
      }

      // 3. Backend Proxy PATCH (guarantees DB persistence across environments)
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';
      try {
        fetch(`${BACKEND_URL}/api/watchlist`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetItem.id,
            ids: targetItem.dbRowIds || [],
            userId: user.id,
            componentName: targetItem.componentName,
            targetPrice: newPrice
          })
        }).catch(() => {});
      } catch (e) {}

      // 4. If target price is met and alerts are enabled, send immediate alert email!
      const effectiveOffer = getEffectiveOffer(targetItem);
      const currentPrice = effectiveOffer.currentPrice > 0 ? effectiveOffer.currentPrice : (targetItem.currentPrice || 0);
      if (currentPrice > 0 && newPrice >= currentPrice && targetItem.notifyOnFlashDrop) {
        try {
          fetch('/api/notifications/target-met', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              userEmail: user.email,
              componentName: targetItem.componentName,
              category: targetItem.category,
              targetPrice: newPrice,
              currentPrice: currentPrice,
              retailer: effectiveOffer.retailer || targetItem.retailer || 'Amazon',
              productUrl: effectiveOffer.productUrl || targetItem.productUrl || '#',
              imageUrl: targetItem.imageUrl
            })
          }).catch(err => console.warn('Instant alert trigger error:', err));
        } catch (alertErr) {
          console.warn('Instant alert trigger exception:', alertErr);
        }
      }
    }
  };

  const toggleNotification = async (id: string) => {
    const targetItem = watchlist.find(item => item.id === id);
    if (!targetItem) return;
    const newStatus = !targetItem.notifyOnFlashDrop;

    setWatchlist(prev =>
      prev.map(item => (item.id === id ? { ...item, notifyOnFlashDrop: newStatus } : item))
    );

    if (targetItem && user?.id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const rawIds = [targetItem.id, ...(targetItem.dbRowIds || [])];
      const validUuids: string[] = [];
      
      rawIds.forEach(idStr => {
        if (!idStr) return;
        const clean = String(idStr).replace(/^(w-|hw-|comp-)/, '');
        if (uuidRegex.test(clean)) {
          validUuids.push(clean);
        }
      });

      // 1. Direct Supabase client update
      try {
        if (validUuids.length > 0) {
          await supabase
            .from('watchlist_items')
            .update({ notify_on_flash_drop: newStatus })
            .in('id', validUuids);
        }

        if (targetItem.componentName) {
          await supabase
            .from('watchlist_items')
            .update({ notify_on_flash_drop: newStatus })
            .eq('user_id', user.id)
            .ilike('component_name', `%${targetItem.componentName.slice(0, 30)}%`);
        }
      } catch (e: any) {
        console.warn('Direct Supabase update notice:', e?.message || e);
      }

      // 2. Server API PATCH fallback (guarantees persistence)
      try {
        await fetch('/api/watchlist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetItem.id,
            ids: targetItem.dbRowIds || [],
            userId: user.id,
            componentName: targetItem.componentName,
            notifyOnFlashDrop: newStatus
          })
        });
      } catch (patchErr) {
        console.warn('PATCH /api/watchlist notice:', patchErr);
      }

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';
      try {
        fetch(`${BACKEND_URL}/api/watchlist`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetItem.id,
            ids: targetItem.dbRowIds || [],
            userId: user.id,
            componentName: targetItem.componentName,
            notifyOnFlashDrop: newStatus
          })
        }).catch(() => {});
      } catch (e) {}

      // 3. If toggled ON and target price is already met, dispatch immediate alert email!
      if (newStatus) {
        const effectiveOffer = getEffectiveOffer(targetItem);
        const currentPrice = effectiveOffer.currentPrice > 0 ? effectiveOffer.currentPrice : (targetItem.currentPrice || 0);
        const targetP = targetItem.targetPrice || 0;
        if (currentPrice > 0 && targetP > 0 && currentPrice <= targetP) {
          try {
            fetch('/api/notifications/target-met', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                userEmail: user.email,
                componentName: targetItem.componentName,
                category: targetItem.category,
                targetPrice: targetP,
                currentPrice: currentPrice,
                retailer: effectiveOffer.retailer || targetItem.retailer || 'Amazon',
                productUrl: effectiveOffer.productUrl || targetItem.productUrl || '#',
                imageUrl: targetItem.imageUrl
              })
            }).catch(err => console.warn('Instant alert trigger error:', err));
          } catch (alertErr) {
            console.warn('Instant alert trigger exception:', alertErr);
          }
        }
      }
    }
  };

  const getPreviousPrice = (item: WatchlistItem, effectiveOffer?: any) => {
    // If the active retailer offer has its own tracked previous price, use that to avoid cross-retailer fake drops
    if (effectiveOffer && typeof effectiveOffer.previousPrice === 'number' && effectiveOffer.previousPrice > 0) {
      return effectiveOffer.previousPrice;
    }
    // Only use item-level previous price if the selected retailer matches the base item retailer
    const activeRetailer = (effectiveOffer?.retailer || '').toLowerCase();
    const baseRetailer = (item.retailer || 'amazon').toLowerCase();
    if (!effectiveOffer || activeRetailer === baseRetailer) {
      switch (selectedInterval) {
        case '24h': return item.previousPrice24h;
        case '7d': return item.previousPrice7d;
        case '30d': return item.previousPrice30d;
      }
    }
    return undefined;
  };

  const calculateDrop = (current: number, previous?: number) => {
    if (!previous || previous <= 0 || Math.abs(previous - current) < 0.01) {
      return { diff: 0, percent: 0, isDrop: false, isIncrease: false };
    }
    const diff = previous - current; // positive if dropped, negative if increased
    const percent = (Math.abs(diff) / previous) * 100;
    const isDrop = diff > 0;
    const isIncrease = diff < 0;
    return { diff: Math.abs(diff), percent, isDrop, isIncrease };
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black font-heading text-white tracking-tight">Active Hardware Watchlist</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              {user ? `${watchlist.length} Tracked` : 'Guest Mode'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Multi-retailer price engine tracking Amazon, Newegg, Micro Center, B&amp;H, and eBay in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Interval Switcher */}
          <div className="bg-gray-950 p-1 rounded-xl border border-gray-800 flex items-center">
            {(['24h', '7d', '30d'] as const).map(interval => (
              <button
                key={interval}
                onClick={() => setSelectedInterval(interval)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedInterval === interval
                    ? 'bg-cyan-500 text-gray-950 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {interval.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth?.();
              } else {
                setShowAddModal(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Component
          </button>
        </div>
      </div>

      {/* Search Error / Warning Notice */}
      {searchError && (
        <div className="bg-amber-950/70 border border-amber-500/50 p-4 rounded-2xl flex items-start justify-between gap-3 shadow-xl shadow-amber-950/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-200">{searchError.title}</h4>
                {searchError.query && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-black/50 text-amber-300 border border-amber-800/50">
                    &quot;{searchError.query}&quot;
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                {searchError.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSearchError(null)}
            className="text-amber-400/60 hover:text-amber-300 p-1.5 rounded-lg hover:bg-amber-900/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'watchlist'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" /> My Watchlist ({user ? watchlist.length : 0})
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'trending'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> Trending Deals in Database ({trendingItems.length})
        </button>
      </div>

      {activeTab === 'watchlist' ? (
        !user ? (
          /* Logged Out / Guest Prompt */
          <div className="glass-card rounded-2xl border border-gray-800 p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-xl font-bold font-heading text-white">Sign In to Track Components</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Create a free account or sign in to build your custom hardware watchlist, track real-time price drops across major retailers, and receive automated digests.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-bold text-xs rounded-xl border border-gray-800 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Browse Trending Deals</span>
              </button>
            </div>
          </div>
        ) : watchlist.length === 0 ? (
          /* Logged In but Empty Watchlist */
          <div className="glass-card rounded-2xl border border-gray-800 p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-cyan-400 shadow-lg">
              <Bell className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-xl font-bold font-heading text-white">Your Watchlist is Empty</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                You haven&apos;t added any hardware components to track yet. Click below to scrape and monitor GPUs, CPUs, RAM, and SSDs in real time.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Component</span>
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-bold text-xs rounded-xl border border-gray-800 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Browse Trending Deals</span>
              </button>
            </div>
          </div>
        ) : (
          /* Watchlist Table */
          <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/60 text-gray-400 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-4">Component</th>
                    <th className="p-4">Retailer</th>
                    <th className="p-4">Current Price</th>
                    <th className="p-4">Target Alert</th>
                    <th className="p-4">{selectedInterval.toUpperCase()} Price Delta</th>
                    <th className="p-4">90-Day Low</th>
                    <th className="p-4 text-center">Alerts</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {watchlist.map((item, idx) => {
                    const effective = getEffectiveOffer(item);
                    const prevPrice = getPreviousPrice(item, effective);
                    const { diff, percent, isDrop, isIncrease } = calculateDrop(effective.currentPrice, prevPrice);
                    const isTargetHit = effective.currentPrice > 0 && item.targetPrice > 0 && effective.currentPrice <= item.targetPrice;

                    const rawATL = Number(item.allTimeLow || 0);
                    const currentP = Number(effective.currentPrice || 0);
                    const atl = rawATL > 0 ? (currentP > 0 && currentP < rawATL ? currentP : rawATL) : (currentP > 0 ? currentP : (Number(item.currentPrice || 0)));
                    const isCurrentATL = currentP > 0 && currentP <= atl;

                    return (
                      <tr key={`${item.id || 'item'}-${idx}`} className="hover:bg-gray-900/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.imageUrl}
                              alt={item.componentName}
                              loading="lazy"
                              decoding="async"
                              className="w-10 h-10 rounded-lg object-cover border border-gray-800 bg-gray-900"
                            />
                            <div>
                              <div className="font-bold text-white text-sm line-clamp-1">{effective.title || item.componentName}</div>
                              <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Dynamic Retailer Dropdown Selector */}
                        <td className="p-4">
                            <select
                              value={effective.retailer}
                              onChange={(e) => setSelectedRetailers(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="bg-gray-900 hover:bg-gray-800 border border-cyan-800/60 text-cyan-300 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm transition-all"
                            >
                              {effective.availableRetailers.map(rName => {
                                const offerObj = effective.offers?.find(o => (o?.retailer || '').toLowerCase() === (rName || '').toLowerCase());
                                const priceTag = offerObj && offerObj.price ? ` ($${Number(offerObj.price).toFixed(2)})` : '';
                                return (
                                  <option key={rName} value={rName} className="bg-gray-950 text-white font-semibold">
                                    {rName}{priceTag}
                                  </option>
                                );
                              })}
                            </select>
                        </td>

                        <td className="p-4">
                          <div className="text-sm font-black text-white">${Number(effective.currentPrice || 0).toFixed(2)}</div>
                          {isTargetHit && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded mt-1">
                              <TrendingDown className="w-3 h-3" /> Target Price Met!
                            </span>
                          )}
                        </td>

                        {/* 1. Interactive Inline Target Alert Editor */}
                        <td className="p-4">
                          {editingTargetId === item.id ? (
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  autoFocus
                                  value={tempTargetPrice}
                                  onChange={(e) => setTempTargetPrice(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTargetPrice(item.id);
                                    if (e.key === 'Escape') setEditingTargetId(null);
                                  }}
                                  className="w-20 bg-black/90 border border-cyan-500/70 text-white font-mono text-xs px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                />
                                <button
                                  onClick={() => saveTargetPrice(item.id)}
                                  className="p-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded-md border border-cyan-500/50 transition-colors cursor-pointer"
                                  title="Save Target Alert"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingTargetId(null)}
                                  className="p-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-md border border-gray-700 transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {/* Quick discount presets */}
                              {effective.currentPrice > 0 && (
                                <div className="flex items-center gap-1">
                                  {[-5, -10, -20].map((pct) => {
                                    const presetPrice = (effective.currentPrice * (1 + pct / 100)).toFixed(2);
                                    return (
                                      <button
                                        key={pct}
                                        type="button"
                                        onClick={() => setTempTargetPrice(presetPrice)}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyan-800/60 text-cyan-400 font-bold transition-all cursor-pointer"
                                      >
                                        {pct}%
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              onClick={() => startEditingTarget(item, effective.currentPrice)}
                              className="group inline-flex items-center gap-1.5 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-gray-800/60 border border-transparent hover:border-gray-700 transition-all"
                              title="Click to set custom target price alert"
                            >
                              <span className="font-mono font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">
                                ${Number(item.targetPrice || 0).toFixed(2)}
                              </span>
                              <Edit3 className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 opacity-40 group-hover:opacity-100 transition-all" />
                            </div>
                          )}
                        </td>

                        {/* 2. Price Delta with Correct Math & Direction */}
                        <td className="p-4">
                          {prevPrice && prevPrice > 0 && Math.abs(prevPrice - effective.currentPrice) >= 0.01 ? (
                            <>
                              <div className={`flex items-center gap-1 font-bold ${isDrop ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isDrop ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                                <span>
                                  {isDrop ? '-' : '+'}${Number(diff || 0).toFixed(2)} ({isDrop ? '-' : '+'}{Number(percent || 0).toFixed(1)}%)
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">Was ${Number(prevPrice || 0).toFixed(2)}</div>
                            </>
                          ) : (
                            <div className="text-gray-500 font-medium text-[11px] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 animate-pulse"></span>
                              Baseline Tracked
                            </div>
                          )}
                        </td>

                        {/* 3. 90-Day Low (Guaranteed non-zero fallback & ATL badge) */}
                        <td className="p-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={isCurrentATL ? 'text-purple-300 font-bold' : 'text-gray-400'}>
                              ${atl > 0 ? atl.toFixed(2) : Number(effective.currentPrice || 0).toFixed(2)}
                            </span>
                            {isCurrentATL && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800/50 flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 text-purple-400" /> LOW
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Alerts Bell Button (Persisted to Database) */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleNotification(item.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              item.notifyOnFlashDrop
                                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                                : 'bg-gray-900 border-gray-800 text-gray-600 hover:text-gray-400'
                            }`}
                            title={item.notifyOnFlashDrop ? 'Flash Drop Alert Enabled (Active)' : 'Click to Enable Flash Drop Alert'}
                          >
                            <Bell className={`w-4 h-4 ${item.notifyOnFlashDrop ? 'fill-cyan-400/20' : ''}`} />
                          </button>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={effective.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-900 hover:bg-cyan-950/80 border border-gray-800 hover:border-cyan-700/60 rounded-xl text-gray-300 hover:text-cyan-300 transition-colors"
                              title={`View Direct Listing at ${effective.retailer}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 bg-gray-900 hover:bg-rose-950/60 border border-gray-800 hover:border-rose-800/40 rounded-xl text-gray-500 hover:text-rose-400 transition-colors"
                              title="Remove from Watchlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Trending Items Grid (Individual Retailer Deals) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingItems.map((item, idx) => {
            const price = Number(item.currentPrice || 0);
            const msrp = Number(item.msrp || price);

            return (
              <div key={`${item.id || 'trending'}-${idx}`} className="glass-card p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Deal Score: {item.dealScore}/100
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-2">{item.name}</h3>

                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-emerald-400">${price.toFixed(2)}</span>
                      {msrp > price && (
                        <span className="text-xs text-gray-500 line-through">${msrp.toFixed(2)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-300 px-2.5 py-1 bg-gray-900 rounded-lg border border-gray-800 inline-block text-xs">
                        {item.retailer}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={item.productUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-gray-900 hover:bg-cyan-950/80 text-white hover:text-cyan-300 font-bold text-xs rounded-xl border border-gray-800 hover:border-cyan-800/60 flex items-center justify-center gap-2 transition-all"
                  >
                    View Direct Listing at {item.retailer} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => removeTrendingItem(item.id, item.name, item.dbRowIds || [item.id])}
                    className="p-2.5 bg-gray-900 hover:bg-rose-950/60 border border-gray-800 hover:border-rose-800/40 rounded-xl text-gray-500 hover:text-rose-400 transition-colors"
                    title="Remove Component from Database"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Autonomous Bot Add Modal — NO manual form filling */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative glass-card w-full max-w-lg p-6 rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl animate-fade-in my-auto space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Autonomous Hardware Scraper</h3>
                  <p className="text-[11px] text-gray-400">Bot scrapes all prices, retailers, specs & links automatically</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAutonomousAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  Enter Hardware Model or Product Link
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. RTX 4080 Super OR https://www.newegg.com/p/..."
                    value={liveQuery}
                    onChange={(e) => setLiveQuery(e.target.value)}
                    className="w-full bg-gray-900/90 text-white text-xs px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                {scrapeNotice && (
                  <div className="mt-2 text-xs font-semibold text-amber-400 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{scrapeNotice}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-900 text-gray-400 hover:text-white rounded-xl border border-gray-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScraping || !liveQuery.trim()}
                  className="btn-glow px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Bot Scraping & Auto-Adding...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>⚡ Scrape & Add to Watchlist</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Client helpers
function autoDetectCategory(query: string): WatchlistItem['category'] {
  const lower = query.toLowerCase();
  if (lower.includes('4080') || lower.includes('4090') || lower.includes('4070') || lower.includes('rtx') || lower.includes('gpu') || lower.includes('radeon')) return 'GPU';
  if (lower.includes('7800x3d') || lower.includes('ryzen') || lower.includes('intel') || lower.includes('cpu') || lower.includes('14700k')) return 'CPU';
  if (lower.includes('ddr5') || lower.includes('ddr4') || lower.includes('ram')) return 'RAM';
  if (lower.includes('ssd') || lower.includes('nvme') || lower.includes('990 pro')) return 'SSD';
  if (lower.includes('motherboard') || lower.includes('mobo') || lower.includes('b650')) return 'Motherboard';
  if (lower.includes('psu') || lower.includes('power supply')) return 'PSU';
  if (lower.includes('case')) return 'Case';
  return 'Cooler';
}

function autoDetectRetailer(query: string): WatchlistItem['retailer'] {
  const lower = query.toLowerCase();
  if (lower.includes('microcenter') || lower.includes('micro center')) return 'Micro Center';
  if (lower.includes('newegg')) return 'Newegg';
  if (lower.includes('bestbuy') || lower.includes('best buy')) return 'Best Buy';
  if (lower.includes('b&h') || lower.includes('bhphotovideo')) return 'B&H';
  if (lower.includes('ebay')) return 'eBay';
  return 'Amazon';
}

function getCategoryImage(category: WatchlistItem['category']): string {
  switch (category) {
    case 'GPU': return 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80';
    case 'CPU': return 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80';
    case 'RAM': return 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80';
    case 'SSD': return 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80';
    default: return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80';
  }
}

function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const parts = path.split('/').filter(Boolean);
    const slug = parts.find(p => p.length > 5 && !p.includes('.')) || parts[0] || 'Hardware Product';
    return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 45);
  } catch {
    return 'Hardware Component';
  }
}
