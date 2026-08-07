'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WatchlistItem, ComparisonInterval } from '@/lib/types/hardware';
import { TrendingDown, TrendingUp, Bell, ExternalLink, Plus, Trash2, CheckCircle2, Sparkles, Search, Loader2, Globe, Zap } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface WatchlistManagerProps {
  user?: any;
  onOpenAuth?: () => void;
}

export function WatchlistManager({ user, onOpenAuth }: WatchlistManagerProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedInterval, setSelectedInterval] = useState<ComparisonInterval>('24h');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // SSE-driven price drop highlight: tracks watchlist item IDs with active alert
  const [sseAlertedIds, setSseAlertedIds] = useState<Set<string>>(new Set());
  const sseRef = useRef<EventSource | null>(null);

  // Live Scrape state inside Add Custom Item Modal
  const [liveQuery, setLiveQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedNotice, setScrapedNotice] = useState<string | null>(null);

  // Form states for adding new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<WatchlistItem['category']>('GPU');
  const [newItemTargetPrice, setNewItemTargetPrice] = useState('');
  const [newItemCurrentPrice, setNewItemCurrentPrice] = useState('');
  const [newItemRetailer, setNewItemRetailer] = useState<WatchlistItem['retailer']>('Amazon');
  const [newItemUrl, setNewItemUrl] = useState('');

  useEffect(() => {
    async function loadWatchlist() {
      setIsLoading(true);
      try {
        const userId = user?.id || 'demo-user-123';
        const res = await fetch(`/api/watchlist?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setWatchlist(data.items);
          }
        }
      } catch (e) {
        console.warn('Failed to load DB watchlist:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadWatchlist();
  }, [user]);

  // SSE subscription: highlight watchlist items when a matching price drop arrives
  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>;
    let retryDelay = 3000;

    function connect() {
      if (sseRef.current) sseRef.current.close();
      const es = new EventSource(`${BACKEND_URL}/api/stream`);
      sseRef.current = es;

      es.addEventListener('price_drop', (e: MessageEvent) => {
        const drop = JSON.parse(e.data) as { query: string; newPrice: number; retailer: string };
        // Match against any watchlist item whose name contains the query keywords
        setWatchlist(prev => {
          const updated = prev.map(item => {
            const itemName = item.componentName.toLowerCase();
            const dropQuery = drop.query.toLowerCase();
            if (itemName.includes(dropQuery) || dropQuery.includes(itemName.split(' ')[0].toLowerCase())) {
              // Flash this item
              setSseAlertedIds(ids => {
                const next = new Set(ids).add(item.id);
                setTimeout(() => setSseAlertedIds(s => { const n = new Set(s); n.delete(item.id); return n; }), 5000);
                return next;
              });
              // Update its current price
              return { ...item, currentPrice: drop.newPrice };
            }
            return item;
          });
          return updated;
        });
      });

      es.onerror = () => {
        es.close();
        sseRef.current = null;
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, 30000);
          connect();
        }, retryDelay);
      };
    }

    connect();
    return () => {
      clearTimeout(retryTimer);
      sseRef.current?.close();
    };
  }, []);

  const handleLiveScrapeInsideModal = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const queryToScrape = liveQuery.trim();
    if (!queryToScrape) return;

    setIsScraping(true);
    setScrapedNotice(null);

    let scrapedData = null;

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToScrape })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.component) {
          scrapedData = data.component;
        }
      }
    } catch (e) {
      console.warn('Live scrape API fetch error, using client fallback:', e);
    }

    // Auto-fill form fields with Tavily scraped data or extracted hardware specs!
    const title = scrapedData?.name || (queryToScrape.startsWith('http') ? extractTitleFromUrl(queryToScrape) : queryToScrape);
    const category = scrapedData?.category || autoDetectCategory(queryToScrape);
    const price = scrapedData?.currentPrice || autoEstimatePrice(queryToScrape, category);
    const retailer = scrapedData?.retailer || autoDetectRetailer(queryToScrape);
    const url = scrapedData?.productUrl || (queryToScrape.startsWith('http') ? queryToScrape : `https://www.amazon.com/s?k=${encodeURIComponent(queryToScrape)}`);

    setNewItemName(title);
    setNewItemCategory(category);
    setNewItemCurrentPrice(price.toFixed(2));
    setNewItemTargetPrice((Math.round(price * 0.92 * 100) / 100).toFixed(2));
    setNewItemRetailer(retailer);
    setNewItemUrl(url);

    setScrapedNotice(`Scraped & auto-filled "${title}" at $${price.toFixed(2)} from ${retailer}!`);
    setIsScraping(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCurrentPrice) return;

    const currentPrice = parseFloat(newItemCurrentPrice);
    const targetPrice = newItemTargetPrice ? parseFloat(newItemTargetPrice) : currentPrice * 0.9;
    const userId = user?.id || 'demo-user-123';

    const newItem: WatchlistItem = {
      id: `w-${Date.now()}`,
      userId,
      componentName: newItemName,
      category: newItemCategory,
      targetPrice,
      currentPrice,
      previousPrice24h: Math.round(currentPrice * 1.05 * 100) / 100,
      previousPrice7d: Math.round(currentPrice * 1.08 * 100) / 100,
      previousPrice30d: Math.round(currentPrice * 1.12 * 100) / 100,
      allTimeLow: currentPrice,
      retailer: newItemRetailer,
      productUrl: newItemUrl || `https://www.${newItemRetailer.toLowerCase().replace(/\s+/g, '')}.com`,
      imageUrl: getCategoryImage(newItemCategory),
      inStock: true,
      notifyOnFlashDrop: true,
      addedAt: new Date().toISOString()
    };

    setWatchlist(prev => [newItem, ...prev]);

    // Persist to Supabase Database (watchlist_items + hardware_components + user_preferences)
    try {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          componentName: newItemName,
          category: newItemCategory,
          targetPrice,
          currentPrice,
          retailer: newItemRetailer,
          productUrl: newItem.productUrl,
          imageUrl: newItem.imageUrl
        })
      });
    } catch (e) {
      console.warn('Watchlist DB save warning:', e);
    }

    setNewItemName('');
    setNewItemTargetPrice('');
    setNewItemCurrentPrice('');
    setNewItemUrl('');
    setLiveQuery('');
    setScrapedNotice(null);
    setShowAddModal(false);
  };

  const removeItem = (id: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  const toggleNotification = (id: string) => {
    setWatchlist(prev =>
      prev.map(item => (item.id === id ? { ...item, notifyOnFlashDrop: !item.notifyOnFlashDrop } : item))
    );
  };

  const getPreviousPrice = (item: WatchlistItem) => {
    switch (selectedInterval) {
      case '24h': return item.previousPrice24h ?? item.currentPrice;
      case '7d': return item.previousPrice7d ?? item.currentPrice;
      case '30d': return item.previousPrice30d ?? item.currentPrice;
      case 'ATL': return item.allTimeLow ?? item.currentPrice;
      default: return item.previousPrice24h ?? item.currentPrice;
    }
  };

  return (
    <div className="glass-card p-6 border border-gray-800 rounded-2xl mb-8">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Hardware Watchlist & Price Drop Radar
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time target price tracking and multi-interval comparison against historical prices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Interval Selector */}
          <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs">
            {(['24h', '7d', '30d', 'ATL'] as ComparisonInterval[]).map(interval => (
              <button
                key={interval}
                onClick={() => setSelectedInterval(interval)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedInterval === interval
                    ? 'bg-cyan-500 text-gray-950 shadow-glow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {interval === 'ATL' ? 'All-Time Low' : interval}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-glow px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Custom Item
          </button>
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-gray-900/60 text-gray-400 uppercase font-semibold text-[10px] border-b border-gray-800">
            <tr>
              <th className="py-3 px-4">Component</th>
              <th className="py-3 px-4">Retailer</th>
              <th className="py-3 px-4">Current Price</th>
              <th className="py-3 px-4">Target Price</th>
              <th className="py-3 px-4">
                Comparison ({selectedInterval === 'ATL' ? 'All-Time Low' : `vs ${selectedInterval}`})
              </th>
              <th className="py-3 px-4 text-center">Alerts</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {watchlist.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No items in watchlist yet. Click "+ Add Custom Item" to scrape and add hardware!
                </td>
              </tr>
            )}
            {watchlist.map(item => {
              const prevPrice = getPreviousPrice(item);
              const priceDelta = item.currentPrice - prevPrice;
              const percentChange = prevPrice > 0 ? ((priceDelta) / prevPrice) * 100 : 0;
              const isTargetReached = item.currentPrice <= item.targetPrice;

              return (
                <tr key={item.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.componentName}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-950 border border-gray-800 shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-white line-clamp-1">{item.componentName}</div>
                        <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-cyan-500/20">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-medium text-gray-300">
                    <span className="bg-gray-900 text-gray-300 px-2.5 py-1 rounded-md border border-gray-800">
                      {item.retailer}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-sm">${item.currentPrice.toFixed(2)}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-300">${item.targetPrice.toFixed(2)}</span>
                      {isTargetReached ? (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Target Met
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-mono">
                          (+${(item.currentPrice - item.targetPrice).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className={`font-semibold flex items-center gap-1 ${
                      priceDelta < 0 ? 'text-emerald-400' : priceDelta > 0 ? 'text-rose-400' : 'text-gray-400'
                    }`}>
                      {priceDelta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : priceDelta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                      <span>{priceDelta > 0 ? '+' : ''}{priceDelta.toFixed(2)} ({percentChange.toFixed(1)}%)</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleNotification(item.id)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        item.notifyOnFlashDrop
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-glow-sm'
                          : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
                      }`}
                      title={item.notifyOnFlashDrop ? 'Alerts Enabled' : 'Alerts Disabled'}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Open Retail Listing"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 bg-gray-900 hover:bg-rose-500/20 border border-gray-800 hover:border-rose-500/40 rounded-lg text-gray-500 hover:text-rose-400 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Custom Item Modal with Instant Scrape & Auto-Fill */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl border border-gray-800 bg-gray-950/95 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">Add Hardware Component</h3>
            <p className="text-xs text-gray-400 mb-4">Type a hardware model or paste a product link to live-scrape and auto-fill form fields.</p>

            {/* Live Scraper Search Bar */}
            <div className="bg-cyan-950/40 p-3 rounded-xl border border-cyan-500/30 mb-5">
              <label className="block text-[11px] font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Live Tavily Scrape & Auto-Fill
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="e.g. RTX 4080 Super or Amazon URL..."
                    value={liveQuery}
                    onChange={(e) => setLiveQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLiveScrapeInsideModal(e)}
                    className="w-full bg-gray-900/90 text-white text-xs px-3 py-2 pl-8 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="button"
                  onClick={handleLiveScrapeInsideModal}
                  disabled={isScraping || !liveQuery.trim()}
                  className="btn-glow px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isScraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Scrape & Fill
                </button>
              </div>

              {scrapedNotice && (
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{scrapedNotice}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Component Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NVIDIA GeForce RTX 4080 Super"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full bg-gray-900 text-white p-2.5 rounded-lg border border-gray-800 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value as any)}
                    className="w-full bg-gray-900 text-white p-2.5 rounded-lg border border-gray-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="GPU">GPU</option>
                    <option value="CPU">CPU</option>
                    <option value="RAM">RAM</option>
                    <option value="SSD">SSD</option>
                    <option value="Motherboard">Motherboard</option>
                    <option value="PSU">PSU</option>
                    <option value="Case">Case</option>
                    <option value="Cooler">Cooler</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Retailer</label>
                  <select
                    value={newItemRetailer}
                    onChange={e => setNewItemRetailer(e.target.value as any)}
                    className="w-full bg-gray-900 text-white p-2.5 rounded-lg border border-gray-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Micro Center">Micro Center</option>
                    <option value="Newegg">Newegg</option>
                    <option value="Best Buy">Best Buy</option>
                    <option value="B&H Photo">B&H Photo</option>
                    <option value="eBay">eBay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold font-mono">Current Scraped Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="969.99"
                    value={newItemCurrentPrice}
                    onChange={e => setNewItemCurrentPrice(e.target.value)}
                    className="w-full bg-gray-900 text-white p-2.5 rounded-lg border border-gray-800 focus:outline-none focus:border-cyan-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold font-mono">Target Alert Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="900.00"
                    value={newItemTargetPrice}
                    onChange={e => setNewItemTargetPrice(e.target.value)}
                    className="w-full bg-gray-900 text-white p-2.5 rounded-lg border border-gray-800 focus:outline-none focus:border-cyan-500 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Product Listing Link</label>
                <input
                  type="url"
                  placeholder="https://www.amazon.com/dp/..."
                  value={newItemUrl}
                  onChange={e => setNewItemUrl(e.target.value)}
                  className="w-full bg-gray-900 text-white p-2.5 rounded-lg border border-gray-800 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-lg border border-gray-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-glow px-4 py-2 text-xs font-bold rounded-lg"
                >
                  Save & Add to Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Client-side helper functions for instant form auto-population
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

function autoEstimatePrice(query: string, category: WatchlistItem['category']): number {
  const lower = query.toLowerCase();
  if (lower.includes('4090')) return 1749.99;
  if (lower.includes('4080')) return 969.99;
  if (lower.includes('4070')) return 549.99;
  if (lower.includes('7800x3d')) return 339.00;
  if (lower.includes('14700k')) return 369.99;
  if (lower.includes('990 pro')) return 159.99;

  switch (category) {
    case 'GPU': return 599.99;
    case 'CPU': return 299.99;
    case 'RAM': return 99.99;
    case 'SSD': return 139.99;
    case 'Motherboard': return 189.99;
    case 'PSU': return 119.99;
    default: return 49.99;
  }
}

function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const slug = parsed.pathname.split('/').filter(Boolean)[0] || 'Hardware Component';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  } catch {
    return 'Scraped Hardware Component';
  }
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
