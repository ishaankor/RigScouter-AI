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
  Database
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

  // Dynamic Retailer selection state (itemId -> retailerName)
  const [selectedRetailers, setSelectedRetailers] = useState<Record<string, string>>({});

  // Helper to extract a canonical hardware key from an item (groups all retailer listings together)
  const getNormalizedKey = (itm: any) => {
    if (!itm) return '';
    const raw = (itm.component_name || itm.componentName || itm.name || itm.model || '').toLowerCase().trim();
    if (raw) {
      return raw
        .replace(/^(asus|msi|gigabyte|zotac|evga|sapphire|xfx|pny|powercolor|asrock|intel|amd|nvidia)\s+/i, '')
        .replace(/-(amazon|best-buy|newegg|micro-center|b-h|ebay)$/i, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    }
    const id = (itm.id || itm.component_id || '').toLowerCase();
    return id.replace(/^(w-|comp-)/, '').replace(/-(amazon|best-buy|newegg|micro-center|b-h|ebay)$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
  };

  // Helper to extract active retailer offer & price dynamically from specs.RetailerOffers or sibling model records
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
    let offers: Array<{ id?: string; retailer: string; price: number; originalPrice?: number; title?: string; url: string; inStock: boolean }> = Array.isArray(specs.RetailerOffers) ? specs.RetailerOffers : [];

    const itemKey = getNormalizedKey(item);
    if (trendingItems.length > 0) {
      const itemTitle = (item.componentName || item.component_name || item.name || '').toLowerCase();
      const siblings = trendingItems.filter(t => {
        const tKey = getNormalizedKey(t);
        if (tKey && tKey === itemKey) return true;
        
        // Fallback for manually added items (w-* IDs) to match with backend hardware_components by model substring
        if (t.model && itemTitle) {
          const tModel = (t.model || '').toLowerCase();
          if (tModel.length > 4 && (itemTitle.includes(tModel) || tModel.includes(itemTitle))) {
            return true;
          }
        }
        return false;
      });
      for (const sib of siblings) {
        if (sib.retailer && !offers.some(o => (o?.retailer || '').toLowerCase() === (sib.retailer || '').toLowerCase())) {
          offers.push({
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

    const combinedOffers = [...offers];
    const itemRetailer = item.retailer || '';
    if (itemRetailer && !combinedOffers.some(o => (o?.retailer || '').toLowerCase() === itemRetailer.toLowerCase())) {
      combinedOffers.push({
        retailer: itemRetailer,
        price: Number(item.currentPrice || item.current_price || 0),
        originalPrice: Number(item.msrp || item.currentPrice || item.current_price || 0),
        title: item.componentName || item.name || 'Component',
        url: item.productUrl || item.product_url || '#',
        inStock: item.inStock ?? true
      });
    }

    // Filter out dummy/unscraped retailers (price is 0 or URL is missing or retailer is empty)
    const validOffers = combinedOffers.filter(o => o && o.retailer && o.price > 0 && o.url && o.url !== '#');
    // If somehow all are invalid, fallback to the original array so the UI doesn't crash
    const finalOffers = validOffers.length > 0 ? validOffers : (combinedOffers.filter(o => o && o.retailer) || []);

    const defaultFallbackRetailer = finalOffers[0]?.retailer || item.retailer || 'Amazon';
    const activeRetailer = selectedRetailers[item.id] || defaultFallbackRetailer;
    const matchedOffer = finalOffers.find(o => (o?.retailer || '').toLowerCase() === (activeRetailer || '').toLowerCase()) || finalOffers[0];

    const isExplicitlySelected = !!selectedRetailers[item.id];
    
    // If the user explicitly selected a retailer and we don't have an offer for it, we shouldn't inherit the default item's price/URL.
    const currentPrice = matchedOffer ? Number(matchedOffer.price || 0) : (isExplicitlySelected ? 0 : Number(item.currentPrice ?? item.current_price ?? 0));
    const msrp = matchedOffer ? Number(matchedOffer.originalPrice ?? currentPrice) : (isExplicitlySelected ? 0 : Number(item.msrp ?? currentPrice));
    const productUrl = matchedOffer ? (matchedOffer.url || '#') : (isExplicitlySelected ? '#' : (item.productUrl ?? item.product_url ?? '#'));
    const retailer = matchedOffer ? (matchedOffer.retailer || activeRetailer) : activeRetailer;
    const title = matchedOffer ? (matchedOffer.title ?? item.componentName ?? item.name ?? 'Component') : (item.componentName ?? item.name ?? 'Component');
    const inStock = matchedOffer ? Boolean(matchedOffer.inStock) : false;

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

  // Fetch watchlist & trending items directly from Supabase DB on mount
  useEffect(() => {
    async function loadDatabaseWatchlist() { console.log("running loadDatabaseWatchlist!");
      setIsLoading(true);
      try {
        const userId = user?.id || 'demo-user-123';

        // 1. Direct Supabase DB Table Query for user watchlist items
        const { data: dbItems } = await supabase
          .from('watchlist_items')
          .select('*')
          .order('id', { ascending: false });

        let formatted: WatchlistItem[] = [];
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
              // Prefer lowest price
              if (item.all_time_low && (!existing.all_time_low || item.all_time_low < existing.all_time_low)) {
                existing.all_time_low = item.all_time_low;
                existing.target_price = item.target_price;
              }
            }
          });

          formatted = Array.from(groupedMap.values()).map((group: any) => ({
            id: group.id,
            dbRowIds: group.dbRowIds,
            userId: group.user_id,
            componentName: group.component_name,
            category: group.category || 'GPU',
            targetPrice: group.target_price || 0,
            currentPrice: group.all_time_low || group.target_price || 0,
            previousPrice24h: group.previous_price_24h,
            previousPrice7d: group.previous_price_7d,
            previousPrice30d: group.previous_price_30d,
            allTimeLow: group.all_time_low,
            retailer: 'Amazon',
            productUrl: '#',
            imageUrl: getCategoryImage(group.category || 'GPU'),
            inStock: true,
            notifyOnFlashDrop: true,
            addedAt: group.added_at,
            specs: { RetailerOffers: group.RetailerOffers || [] }
          }));
        }

        // 2. Direct Supabase DB Table Query for trending hardware catalog
        const { data: hwCatalog } = await supabase
          .from('hardware_components')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(500);

        // Also merge any user items saved in hardware_components
        if (hwCatalog && hwCatalog.length > 0) {
          const userHwMap = new Map<string, any>();
          hwCatalog.forEach((item: any) => {
            try {
              const specs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
              const isUserItem = specs.user_watchlist === userId || specs.source === 'User Watchlist Addition';
              if (isUserItem) {
                const key = getNormalizedKey(item);
                if (key && !formatted.some(f => getNormalizedKey(f) === key) && !userHwMap.has(key)) {
                  userHwMap.set(key, {
                    id: `w-${item.id}`,
                    userId: userId,
                    componentName: item.name,
                    category: item.category || 'GPU',
                    targetPrice: Math.round((item.current_price || 100) * 0.9 * 100) / 100,
                    currentPrice: item.current_price || 0,
                    previousPrice24h: Math.round((item.current_price || 100) * 1.05 * 100) / 100,
                    previousPrice7d: Math.round((item.current_price || 100) * 1.08 * 100) / 100,
                    previousPrice30d: Math.round((item.current_price || 100) * 1.12 * 100) / 100,
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

        // Recover pending scrapes from sessionStorage to survive Safari tab suspend & Fast Refresh
        let recoveredPending: WatchlistItem[] = [];
        try {
          const stored = JSON.parse(sessionStorage.getItem('pendingScrapes') || '[]');
          const now = Date.now();
          
          const activePending = stored.filter((p: WatchlistItem) => {
            const isOld = now - new Date(p.addedAt).getTime() > 3 * 60 * 1000; // Drop after 3 mins
            const isInDb = formatted.some((f) => (f.id && p.id && f.id.includes(p.id)) || (f.componentName || '').toLowerCase() === (p.componentName || '').toLowerCase());
            return !isOld && !isInDb;
          });
          
          sessionStorage.setItem('pendingScrapes', JSON.stringify(activePending));
          recoveredPending = activePending;
        } catch (e) {}

        setWatchlist([...recoveredPending, ...formatted]);

        if (hwCatalog && hwCatalog.length > 0) {
          const formattedTrending = hwCatalog.map((item: any) => {
            const current = item.current_price || 0;
            const msrp = item.msrp || current;
            const lowest = item.lowest_price_90d || current;

            // 100% Dynamic deal score computed from real price ratios (NO hardcoded fallback numbers)
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
    const queryToScrape = liveQuery.trim();
    if (!queryToScrape) return;

    setIsScraping(true);
    setScrapeNotice(null);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';
    const userId = user?.id || 'demo-user-123';
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

        // Insert to Supabase watchlist (best price only)
        if (payload.price <= bestPrice) {
          const wl_row: any = {
            component_id: `comp-${(payload.title || queryToScrape).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            component_name: payload.title,
            category: category,
            target_price: Math.round(payload.price * 0.9 * 100) / 100,
            previous_price_24h: Math.round(payload.price * 1.05 * 100) / 100,
            previous_price_7d: Math.round(payload.price * 1.08 * 100) / 100,
            previous_price_30d: Math.round(payload.price * 1.12 * 100) / 100,
            all_time_low: payload.price,
          };
          if (userId) {
            wl_row.user_id = userId;
          }
          const { error: upsertErr } = await supabase.from('watchlist_items').insert(wl_row);
          if (upsertErr) console.warn('[Watchlist DB Notice]', upsertErr.message);
        }
      }
    });

    es.addEventListener('agent_complete', (e: MessageEvent) => {
      const payload = JSON.parse(e.data);
      const isMatch = (payload.original_query && payload.original_query.toLowerCase() === queryToScrape.toLowerCase()) || 
                      payload.query.toLowerCase() === queryToScrape.toLowerCase() ||
                      payload.query.toLowerCase().includes(queryToScrape.toLowerCase()) ||
                      queryToScrape.toLowerCase().includes(payload.query.toLowerCase());
                      
      if (isMatch) {
        setIsScraping(false);
        if (payload.summary && !payload.bestOffer) {
          setScrapeNotice(payload.summary);
        }
        es.close();
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

  const removeTrendingItem = async (id: string, name: string) => {
    setTrendingItems(prev => prev.filter(item => item.id !== id));
    try {
      const { error } = await supabase.from('hardware_components').delete().eq('id', id);
      if (error) {
        console.warn('[Supabase DB Delete Warning] hardware_components:', error.message);
      } else {
        console.log(`[Supabase DB Delete Success] Removed component "${name}" (${id}) from hardware_components table.`);
      }
    } catch (e) {}

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';
    try {
      await fetch(`${BACKEND_URL}/api/components/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}
  };

  const toggleNotification = (id: string) => {
    setWatchlist(prev =>
      prev.map(item => (item.id === id ? { ...item, notifyOnFlashDrop: !item.notifyOnFlashDrop } : item))
    );
  };

  const getPreviousPrice = (item: WatchlistItem) => {
    switch (selectedInterval) {
      case '24h': return item.previousPrice24h || item.currentPrice * 1.04;
      case '7d': return item.previousPrice7d || item.currentPrice * 1.08;
      case '30d': return item.previousPrice30d || item.currentPrice * 1.12;
    }
  };

  const calculateDrop = (current: number, previous: number) => {
    const diff = previous - current;
    const percent = (diff / previous) * 100;
    return { diff, percent };
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-cyan-400" />
            Hardware Watchlist & Price Drop Radar
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Autonomous multi-retailer target price tracking & live database catalog
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Interval Selector */}
          <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs">
            {(['24h', '7d', '30d'] as const).map(interval => (
              <button
                key={interval}
                onClick={() => setSelectedInterval(interval)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedInterval === interval
                    ? 'bg-cyan-500 text-gray-950 shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {interval.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (!user && onOpenAuth) {
                onOpenAuth();
              } else {
                setShowAddModal(true);
              }
            }}
            className="btn-glow px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Bot className="w-4 h-4" />
            Add Hardware via Bot {!user && '(Sign In Required)'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'watchlist'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          My Watchlist ({watchlist.length})
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'trending'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Trending Deals in Database ({trendingItems.length})
        </button>
      </div>

      {/* Table Content */}
      {activeTab === 'watchlist' ? (
        <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/50 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
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
                {watchlist.map(item => {
                  const effective = getEffectiveOffer(item);
                  const prevPrice = getPreviousPrice(item);
                  const { diff, percent } = calculateDrop(effective.currentPrice, prevPrice);
                  const isDrop = diff > 0;
                  const isTargetHit = effective.currentPrice <= item.targetPrice;

                  return (
                    <tr key={item.id} className="hover:bg-gray-900/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.componentName}
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

                      <td className="p-4 font-mono font-bold text-gray-300">${Number(item.targetPrice || 0).toFixed(2)}</td>

                      <td className="p-4">
                        <div className={`flex items-center gap-1 font-bold ${isDrop ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isDrop ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          <span>${Math.abs(diff || 0).toFixed(2)} ({Number(percent || 0).toFixed(1)}%)</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">Was ${Number(prevPrice || 0).toFixed(2)}</div>
                      </td>

                      <td className="p-4 font-mono text-gray-400">${Number(item.allTimeLow || 0).toFixed(2)}</td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleNotification(item.id)}
                          className={`p-2 rounded-xl border transition-all ${
                            item.notifyOnFlashDrop
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                              : 'bg-gray-900 border-gray-800 text-gray-600'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
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
      ) : (
        /* Trending Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingItems.map(item => {
            const effective = getEffectiveOffer(item);

            return (
              <div key={item.id} className="glass-card p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
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
                      <span className="text-xl font-black text-emerald-400">${Number(effective.currentPrice || 0).toFixed(2)}</span>
                      {effective.msrp > effective.currentPrice && (
                        <span className="text-xs text-gray-500 line-through">${Number(effective.msrp || 0).toFixed(2)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-300 px-2.5 py-1 bg-gray-900 rounded-lg border border-gray-800 inline-block text-xs">
                        {effective.retailer}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={effective.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-gray-900 hover:bg-cyan-950/80 text-white hover:text-cyan-300 font-bold text-xs rounded-xl border border-gray-800 hover:border-cyan-800/60 flex items-center justify-center gap-2 transition-all"
                  >
                    View Direct Listing at {effective.retailer} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => removeTrendingItem(item.id, item.name)}
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
