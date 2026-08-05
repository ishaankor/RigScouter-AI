'use client';

import React, { useState } from 'react';
import { WatchlistItem, ComparisonInterval } from '@/lib/types/hardware';
import { MOCK_INITIAL_WATCHLIST } from '@/lib/scrapers/price-scraper';
import { TrendingDown, TrendingUp, Bell, ExternalLink, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export function WatchlistManager() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(MOCK_INITIAL_WATCHLIST);
  const [selectedInterval, setSelectedInterval] = useState<ComparisonInterval>('24h');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<WatchlistItem['category']>('GPU');
  const [newItemTargetPrice, setNewItemTargetPrice] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemTargetPrice) return;

    const targetPrice = parseFloat(newItemTargetPrice);
    const mockCurrent = Math.round((targetPrice * 1.05) * 100) / 100;

    const newItem: WatchlistItem = {
      id: `w-${Date.now()}`,
      userId: 'user-demo-123',
      componentName: newItemName,
      category: newItemCategory,
      targetPrice,
      currentPrice: mockCurrent,
      previousPrice24h: mockCurrent + 15,
      previousPrice7d: mockCurrent + 25,
      previousPrice30d: mockCurrent + 40,
      allTimeLow: mockCurrent - 10,
      retailer: 'Amazon',
      productUrl: newItemUrl || 'https://www.amazon.com',
      imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
      inStock: true,
      notifyOnFlashDrop: true,
      addedAt: new Date().toISOString()
    };

    setWatchlist([newItem, ...watchlist]);
    setNewItemName('');
    setNewItemTargetPrice('');
    setNewItemUrl('');
    setShowAddModal(false);
  };

  const handleRemoveItem = (id: string) => {
    setWatchlist(watchlist.filter(item => item.id !== id));
  };

  const getDeltaForInterval = (item: WatchlistItem, interval: ComparisonInterval) => {
    let prevPrice = item.previousPrice24h;
    if (interval === '7d') prevPrice = item.previousPrice7d;
    if (interval === '30d') prevPrice = item.previousPrice30d;
    if (interval === 'ATL') prevPrice = item.allTimeLow;

    const diff = item.currentPrice - prevPrice;
    const percent = prevPrice > 0 ? (diff / prevPrice) * 100 : 0;

    return {
      diff: Math.round(diff * 100) / 100,
      percent: Math.round(percent * 10) / 10,
      isATL: interval === 'ATL' && item.currentPrice <= item.allTimeLow
    };
  };

  return (
    <div className="glass-card p-6 border border-gray-800 rounded-2xl mb-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
            <Bell className="w-6 h-6 text-cyan-400" />
            Watchlist & Price Tracker
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Real-time scraping across Amazon, Micro Center, Newegg, Best Buy & eBay.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Interval Selector Buttons */}
          <div className="bg-gray-900/80 p-1 rounded-xl border border-gray-800 flex items-center gap-1">
            {(['24h', '7d', '30d', 'ATL'] as ComparisonInterval[]).map((int) => (
              <button
                key={int}
                onClick={() => setSelectedInterval(int)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedInterval === int
                    ? 'bg-cyan-500 text-gray-950 shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {int === 'ATL' ? 'vs All-Time Low' : `vs ${int}`}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-glow px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Track Item
          </button>
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-900/60 text-xs uppercase text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-3 px-4">Component</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Current Price</th>
              <th className="py-3 px-4">Target</th>
              <th className="py-3 px-4">Change ({selectedInterval})</th>
              <th className="py-3 px-4">Retailer</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {watchlist.map((item) => {
              const delta = getDeltaForInterval(item, selectedInterval);
              const meetsTarget = item.currentPrice <= item.targetPrice;

              return (
                <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-4 px-4 font-medium text-white flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.componentName}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-700 bg-gray-900"
                    />
                    <div>
                      <div className="font-semibold text-gray-100 flex items-center gap-2">
                        {item.componentName}
                        {meetsTarget && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Target Hit
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{item.retailer}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-md border border-gray-700 font-mono">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-white text-base">
                    ${item.currentPrice.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-gray-400">
                    ${item.targetPrice.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 font-semibold">
                    {delta.diff === 0 ? (
                      <span className="text-gray-400">No Change</span>
                    ) : delta.diff < 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        -${Math.abs(delta.diff).toFixed(2)} ({delta.percent}%)
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        +${delta.diff.toFixed(2)} (+{delta.percent}%)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs font-medium"
                    >
                      {item.retailer}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Add Product to Watchlist
            </h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Component Name</label>
                <input
                  type="text"
                  placeholder="e.g. Corsair RM850x 850W PSU"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as WatchlistItem['category'])}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    {['GPU', 'CPU', 'RAM', 'SSD', 'Motherboard', 'PSU', 'Case', 'Cooler'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Target Price ($)</label>
                  <input
                    type="number"
                    placeholder="120.00"
                    value={newItemTargetPrice}
                    onChange={(e) => setNewItemTargetPrice(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Product Page URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://www.amazon.com/dp/..."
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-glow px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
