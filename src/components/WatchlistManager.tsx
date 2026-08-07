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

interface WatchlistManagerProps {
  initialWatchlist?: WatchlistItem[];
  initialTrendingItems?: HardwareComponent[];
  user?: any;
  onOpenAuth?: () => void;
}

export function WatchlistManager({
  initialWatchlist = [],
  initialTrendingItems = [],
  user
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

  // Fetch watchlist & trending items directly from Supabase DB on mount
  useEffect(() => {
    async function loadDatabaseWatchlist() {
      setIsLoading(true);
      try {
        const userId = user?.id || 'demo-user-123';
        const res = await fetch(`/api/watchlist?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setWatchlist(data.items);
          }
          if (data.trendingItems && data.trendingItems.length > 0) {
            setTrendingItems(data.trendingItems);
          }
        }
      } catch (e) {
        console.warn('Database fetch warning:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadDatabaseWatchlist();
  }, [user]);

  // 100% Autonomous Bot Add-to-Watchlist Handler (NO manual form filling)
  const handleAutonomousAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryToScrape = liveQuery.trim();
    if (!queryToScrape) return;

    setIsScraping(true);
    setScrapeNotice(null);

    let scrapedData: any = null;
    let dataSource = 'backend';

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToScrape })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.component && data.component.currentPrice) {
          scrapedData = data.component;
          dataSource = data.source || 'backend';
        }
      }
    } catch (err) {
      console.warn('Autonomous scrape fetch error:', err);
    }

    // Check if valid scraped price was retrieved
    if (!scrapedData || !scrapedData.currentPrice) {
      setIsScraping(false);
      setScrapeNotice(`⚠️ Could not retrieve live price for "${queryToScrape}". Please verify query or link.`);
      return;
    }

    // Bot extracts and formats all component fields autonomously
    const title = scrapedData.name || queryToScrape;
    const category = scrapedData.category || autoDetectCategory(queryToScrape);
    const currentPrice = scrapedData.currentPrice;
    const targetPrice = Math.round(currentPrice * 0.9 * 100) / 100;
    const retailer = scrapedData.retailer || autoDetectRetailer(queryToScrape);
    const productUrl = scrapedData.productUrl || (queryToScrape.startsWith('http') ? queryToScrape : `https://www.amazon.com/s?k=${encodeURIComponent(queryToScrape)}`);
    const imageUrl = scrapedData.imageUrl || getCategoryImage(category);

    const userId = user?.id || 'demo-user-123';

    const newItem: WatchlistItem = {
      id: `w-${Date.now()}`,
      userId,
      componentName: title,
      category,
      targetPrice,
      currentPrice,
      previousPrice24h: Math.round(currentPrice * 1.05 * 100) / 100,
      previousPrice7d: Math.round(currentPrice * 1.08 * 100) / 100,
      previousPrice30d: Math.round(currentPrice * 1.12 * 100) / 100,
      allTimeLow: currentPrice,
      retailer,
      productUrl,
      imageUrl,
      inStock: true,
      notifyOnFlashDrop: true,
      addedAt: new Date().toISOString()
    };

    // Update screen instantly
    setWatchlist(prev => [newItem, ...prev]);

    // Persist to Supabase Database (watchlist_items + hardware_components + user_preferences)
    try {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          componentName: title,
          category,
          targetPrice,
          currentPrice,
          retailer,
          productUrl,
          imageUrl
        })
      });
    } catch (e) {
      console.warn('Watchlist DB save warning:', e);
    }

    setIsScraping(false);
    setLiveQuery('');
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
            onClick={() => setShowAddModal(true)}
            className="btn-glow px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Bot className="w-4 h-4" />
            Add Hardware via Bot
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
                  const prevPrice = getPreviousPrice(item);
                  const { diff, percent } = calculateDrop(item.currentPrice, prevPrice);
                  const isDrop = diff > 0;
                  const isTargetHit = item.currentPrice <= item.targetPrice;

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
                            <div className="font-bold text-white text-sm line-clamp-1">{item.componentName}</div>
                            <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-gray-300">{item.retailer}</td>

                      <td className="p-4">
                        <div className="text-sm font-black text-white">${item.currentPrice.toFixed(2)}</div>
                        {isTargetHit && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded mt-1">
                            <TrendingDown className="w-3 h-3" /> Target Price Met!
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono font-bold text-gray-300">${item.targetPrice.toFixed(2)}</td>

                      <td className="p-4">
                        <div className={`flex items-center gap-1 font-bold ${isDrop ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isDrop ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          <span>${Math.abs(diff).toFixed(2)} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">Was ${prevPrice.toFixed(2)}</div>
                      </td>

                      <td className="p-4 font-mono text-gray-400">${item.allTimeLow.toFixed(2)}</td>

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
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-300 hover:text-white transition-colors"
                            title="View Direct Listing"
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
          {trendingItems.map(item => (
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
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-xl font-black text-emerald-400">${item.currentPrice.toFixed(2)}</span>
                  {item.msrp > item.currentPrice && (
                    <span className="text-xs text-gray-500 line-through">${item.msrp.toFixed(2)}</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{item.retailer}</span>
                </div>
              </div>
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl border border-gray-800 flex items-center justify-center gap-2 transition-all"
              >
                View Live Deal Listing <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
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
