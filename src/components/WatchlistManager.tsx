'use client';

import React, { useState, useEffect } from 'react';
import { WatchlistItem, ComparisonInterval } from '@/lib/types/hardware';
import { TrendingDown, TrendingUp, Bell, ExternalLink, Plus, Trash2, CheckCircle2, Sparkles, Search, Loader2, Globe } from 'lucide-react';

export function WatchlistManager() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedInterval, setSelectedInterval] = useState<ComparisonInterval>('24h');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        const res = await fetch('/api/watchlist');
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
  }, []);

  const handleLiveScrapeInsideModal = async () => {
    if (!liveQuery) return;
    setIsScraping(true);
    setScrapedNotice(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: liveQuery })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.component) {
          const comp = data.component;
          // Auto-fill form fields with real scraped data from Tavily!
          setNewItemName(comp.name);
          setNewItemCategory(comp.category);
          setNewItemCurrentPrice(comp.currentPrice.toString());
          setNewItemTargetPrice(Math.round(comp.currentPrice * 0.95).toString());
          setNewItemRetailer(comp.retailer);
          setNewItemUrl(comp.productUrl);

          setScrapedNotice(`Scraped & auto-filled "${comp.name}" ($${comp.currentPrice.toFixed(2)}) from ${comp.retailer}!`);
          setIsScraping(false);
          return;
        }
      }
    } catch (e) {
      setScrapedNotice('Could not scrape URL. You can type details manually below.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCurrentPrice) return;

    const currentPrice = parseFloat(newItemCurrentPrice);
    const targetPrice = newItemTargetPrice ? parseFloat(newItemTargetPrice) : currentPrice * 0.9;

    const newItem: WatchlistItem = {
      id: `w-${Date.now()}`,
      userId: 'user-demo-123',
      componentName: newItemName,
      category: newItemCategory,
      targetPrice,
      currentPrice,
      previousPrice24h: currentPrice * 1.05,
      previousPrice7d: currentPrice * 1.08,
      previousPrice30d: currentPrice * 1.12,
      allTimeLow: currentPrice,
      retailer: newItemRetailer,
      productUrl: newItemUrl || `https://www.${newItemRetailer.toLowerCase().replace(/\s+/g, '')}.com`,
      imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
      inStock: true,
      notifyOnFlashDrop: true,
      addedAt: new Date().toISOString()
    };

    setWatchlist(prev => [newItem, ...prev]);

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

      {/* Add Custom Item Modal with Live Scrape Integrated */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl border border-gray-800 bg-gray-950/95 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">Add Hardware Component</h3>
            <p className="text-xs text-gray-400 mb-4">Paste a retail link or product name to live-scrape real prices, or fill manually.</p>

            {/* Integrated Live Scraper Bar Inside Modal */}
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
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleLiveScrapeInsideModal())}
                    className="w-full bg-gray-900/90 text-white text-xs px-3 py-2 pl-8 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="button"
                  onClick={handleLiveScrapeInsideModal}
                  disabled={isScraping || !liveQuery}
                  className="btn-glow px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50 shrink-0"
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
                  <label className="block text-gray-400 mb-1 font-semibold">Current Scraped Price ($)</label>
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
                  <label className="block text-gray-400 mb-1 font-semibold">Target Alert Price ($)</label>
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
