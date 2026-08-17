'use client';

import React, { useState, useEffect } from 'react';
import { DigestFrequency, ComparisonInterval, DailyDigestReport, DigestItemSummary, WatchlistItem } from '@/lib/types/hardware';
import { generateDailyDigestReport } from '@/lib/ai/digest-generator';
import { MOCK_INITIAL_WATCHLIST } from '@/lib/scrapers/price-scraper';
import { supabase } from '@/lib/db/supabase';
import { Calendar, Mail, MessageSquare, Send, Sparkles, TrendingDown, RefreshCw, Check, LogIn, ShieldCheck } from 'lucide-react';

interface DailyDigestPreviewProps {
  user?: any;
  onOpenAuth?: () => void;
}

export function DailyDigestPreview({ user, onOpenAuth }: DailyDigestPreviewProps) {
  const [frequency, setFrequency] = useState<DigestFrequency>('daily');
  const [deliveryChannel, setDeliveryChannel] = useState<'email' | 'discord' | 'telegram'>('email');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedIntervals, setSelectedIntervals] = useState<ComparisonInterval[]>(['24h', '7d', '30d', 'ATL']);
  const [isSubscribed, setIsSubscribed] = useState(!!user);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  
  const [report, setReport] = useState<DailyDigestReport | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchUserWatchlist = async () => {
    if (!user) return MOCK_INITIAL_WATCHLIST;
    const { data, error } = await supabase.from('watchlist_items').select('*').eq('user_id', user.id);
    if (error || !data) return MOCK_INITIAL_WATCHLIST;
    
    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      componentName: item.component_name,
      category: item.category,
      targetPrice: item.target_price,
      currentPrice: item.current_price,
      previousPrice24h: item.previous_price_24h || item.current_price,
      previousPrice7d: item.previous_price_7d || item.current_price,
      previousPrice30d: item.previous_price_30d || item.current_price,
      allTimeLow: item.all_time_low || item.current_price,
      retailer: item.retailer,
      productUrl: item.product_url,
      imageUrl: item.image_url,
      inStock: item.in_stock,
      notifyOnFlashDrop: item.notify_on_flash_drop,
      addedAt: item.added_at,
      specs: item.specs
    })) as WatchlistItem[];
  };

  useEffect(() => {
    fetchUserWatchlist().then(async items => {
      const generated = await generateDailyDigestReport(items);
      setReport(generated);
    });
  }, [user]);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    const items = await fetchUserWatchlist();
    const generated = await generateDailyDigestReport(items);
    setReport(generated);
    setIsGenerating(false);
  };

  const handleSaveSubscription = async () => {
    if (!user && onOpenAuth) {
      onOpenAuth();
      return;
    }
    
    setIsSubscribed(true);
    
    try {
      const routingEmail = customEmail.trim() || user?.email;
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        summary_frequency: frequency,
        delivery_channels: JSON.stringify({ email: deliveryChannel === 'email', emailAddress: routingEmail }),
        comparison_intervals: JSON.stringify(selectedIntervals),
        auto_recommend_alternatives: true
      });
      if (error) throw error;
      setSaveNotice(`✅ Preferences saved! Digest routes to ${routingEmail} via ${deliveryChannel.toUpperCase()} at 08:00 AM UTC.`);
    } catch (e: any) {
      console.error('Error saving preferences', e);
      setSaveNotice(`⚠️ Failed to save preferences to DB: ${e.message || JSON.stringify(e)}`);
    }

    setTimeout(() => setSaveNotice(null), 4000);
  };

  const toggleInterval = (int: ComparisonInterval) => {
    if (selectedIntervals.includes(int)) {
      if (selectedIntervals.length > 1) {
        setSelectedIntervals(selectedIntervals.filter(i => i !== int));
      }
    } else {
      setSelectedIntervals([...selectedIntervals, int]);
    }
  };

  return (
    <div className="glass-card p-6 border border-gray-800 rounded-2xl mb-8">
      {/* Auth Subscription Guard Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-purple-950/90 via-gray-950 to-cyan-950/90 border border-purple-500/40 p-5 rounded-2xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                Automated Digest Subscription (Sign In Required)
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Users must be signed in to subscribe and receive automated price drop digests dispatched to Email or Discord.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-gray-950 font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Subscribe
          </button>
        </div>
      )}

      {/* Top Title & Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-500/30">
              Daily Automater Feature
            </span>
            <h2 className="text-2xl font-bold font-heading text-white">Automated Price Digest Engine</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Receives real-time price scrapes, computes multi-interval deltas, and delivers an executive summary to your preferred channel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Subscribed (Active)
            </span>
          )}
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isGenerating ? 'animate-spin' : ''}`} />
            Run Automater Cycle Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Configuration */}
        <div className="lg:col-span-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          {/* Summary Frequency */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-400" /> Summary Frequency
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'daily', label: 'Daily (8:00 AM)' },
                { id: 'every_3_days', label: 'Every 3 Days' },
                { id: 'weekly', label: 'Weekly Digest' },
                { id: 'flash_only', label: 'Flash Sales Only' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFrequency(item.id as DigestFrequency)}
                  className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${
                    frequency === item.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-black/20 text-gray-400 border-white/5 hover:text-white hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Channel */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-purple-400" /> Delivery Destination
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'discord', label: 'Discord', icon: MessageSquare },
                { id: 'telegram', label: 'Telegram', icon: Send },
              ].map((ch) => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setDeliveryChannel(ch.id as any)}
                    className={`p-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${
                      deliveryChannel === ch.id
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-black/20 text-gray-400 border-white/5 hover:text-white hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
            
            {deliveryChannel === 'email' && (
              <div className="mt-3 animate-fade-in">
                <input
                  type="email"
                  placeholder={user?.email ? `Default: ${user.email}` : "Custom routing email address"}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-black/40 border border-purple-500/30 text-xs text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 placeholder:text-gray-500 transition-all shadow-inner"
                />
              </div>
            )}
          </div>

          {/* Price Interval Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Include Comparison Intervals
            </label>
            <div className="flex flex-wrap gap-2">
              {(['24h', '7d', '30d', 'ATL'] as ComparisonInterval[]).map((int) => {
                const active = selectedIntervals.includes(int);
                return (
                  <button
                    key={int}
                    onClick={() => toggleInterval(int)}
                    className={`px-4 py-2 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-black/20 text-gray-500 border-white/5 hover:text-gray-300 hover:border-white/10'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {int === 'ATL' ? 'vs All-Time Low' : `vs ${int}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Subscription Preferences Button */}
          <button
            onClick={handleSaveSubscription}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
          >
            {user ? 'Save Subscription Preferences' : 'Sign In to Subscribe'}
          </button>

          {saveNotice && (
            <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
              {saveNotice}
            </div>
          )}
        </div>

        {/* Generated Live Digest Preview */}
        <div className="lg:col-span-8 bg-gray-950/80 p-6 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <div className="text-xs text-gray-400 font-mono">
              PREVIEW CHANNEL: <span className="text-purple-400 font-bold uppercase">{deliveryChannel}</span>
            </div>
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Engine Active
            </div>
          </div>

          {/* Dynamic Mockup Body */}
          <div className="relative mt-6">
            {deliveryChannel === 'email' ? (
              // ================= EMAIL MOCKUP =================
              <div className="bg-gradient-to-b from-gray-900 to-[#121216] p-8 rounded-2xl shadow-2xl mx-auto border border-gray-800/80">
                <div className="text-center mb-8 pb-6 border-b border-gray-800/60">
                  <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                    RigScouter AI Digest
                  </h1>
                  <p className="text-gray-400 text-sm font-medium">{report ? report.headline : 'Generating intelligence...'}</p>
                </div>
                
                <div className="space-y-6 text-sm">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/5">
                    <p className="text-gray-300 leading-relaxed">{report ? report.executiveSummary : 'Analyzing market data and formulating strategy...'}</p>
                  </div>

                  {report?.biggestDrop && (
                    <div className="bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border border-emerald-500/50 p-5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] transform transition-all duration-300 hover:scale-[1.01]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-emerald-400 font-bold tracking-wider text-[10px] uppercase">↘ Top Daily Drop</span>
                            {report?.biggestDrop?.isAllTimeLow && (
                              <span className="bg-emerald-500 text-emerald-950 text-[10px] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.5)] font-black">ALL-TIME LOW</span>
                            )}
                          </div>
                          <h3 className="text-lg font-extrabold text-white">{report?.biggestDrop?.item.componentName}</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 p-3 bg-black/40 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[10px] font-bold uppercase mb-1">New Price</span>
                          <span className="text-emerald-400 font-black text-lg">${report?.biggestDrop?.item.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[10px] font-bold uppercase mb-1">24h Drop</span>
                          <span className="text-white font-bold text-lg">-${Math.abs(report?.biggestDrop?.change24h.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[10px] font-bold uppercase mb-1">Retailer</span>
                          <span className="text-cyan-400 font-bold text-lg truncate">{report?.biggestDrop?.item.retailer}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interval Comparison Breakdown Table */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-wider mb-3 ml-1">Price Deltas</h4>
                    <div className="space-y-2">
                      {report?.items.map((itemSummary: DigestItemSummary) => (
                        <div key={itemSummary.item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/20 p-3.5 rounded-xl border border-white/5 text-xs hover:bg-white/5 transition-colors">
                          <div className="font-bold text-gray-200 mb-2 sm:mb-0 line-clamp-1 pr-4">{itemSummary.item.componentName}</div>
                          <div className="flex items-center gap-3 text-gray-400 shrink-0">
                            <span className="font-black text-white bg-white/10 px-2 py-1 rounded-md">${itemSummary.item.currentPrice.toFixed(2)}</span>
                            {selectedIntervals.includes('24h') && (
                              <span className={itemSummary.change24h.amount <= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-medium'}>
                                {itemSummary.change24h.amount <= 0 ? '' : '+'}${itemSummary.change24h.amount.toFixed(2)}
                              </span>
                            )}
                            {selectedIntervals.includes('ATL') && itemSummary.isAllTimeLow && (
                              <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black text-[9px] border border-emerald-500/30">ATL</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {report?.items.some((i: DigestItemSummary) => i.alternativePick) && (
                    <div className="mt-6 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/20 border border-fuchsia-500/40 p-5 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.1)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-24 h-24 text-fuchsia-400" />
                      </div>
                      <div className="font-black text-fuchsia-400 mb-3 flex items-center gap-2 relative z-10 text-xs tracking-wider uppercase">
                        <Sparkles className="w-4 h-4" /> AI Recommendations
                      </div>
                      <div className="space-y-3 relative z-10">
                        {report.items.filter((i: DigestItemSummary) => i.alternativePick).map((i: DigestItemSummary, idx: number) => (
                          <div key={idx} className="text-gray-300 text-sm bg-black/40 p-3 rounded-lg border border-white/5">
                            Replace <span className="font-bold text-white">{i.item.componentName}</span> with <span className="font-bold text-cyan-400">{i.alternativePick?.name}</span> to save <span className="text-emerald-400 font-black">${i.alternativePick?.savings.toFixed(2)}</span>.
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // ================= DISCORD / TELEGRAM MOCKUP =================
              <div className="bg-[#36393f] mx-auto rounded-lg flex overflow-hidden shadow-2xl border border-[#202225] font-sans">
                {/* Embed Left Pillar */}
                <div className="w-1.5 bg-[#5865F2] shrink-0"></div>
                
                <div className="p-4 w-full text-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">RS</div>
                    <span className="font-bold text-white text-sm">RigScouter Bot</span>
                    <span className="bg-[#5865F2] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                      <Check className="w-3 h-3" /> Bot
                    </span>
                    <span className="text-xs text-[#72767d] ml-1">Today at 8:00 AM</span>
                  </div>
                  
                  <div className="pl-1">
                    <div className="font-bold text-[#00b0f4] mb-2 hover:underline cursor-pointer">{report ? report.headline : 'Generating...'}</div>
                    <div className="text-sm text-[#dcddde] mb-4 leading-snug">{report ? report.executiveSummary : 'Analyzing market data...'}</div>
                    
                    {report?.biggestDrop && (
                      <div className="bg-[#2f3136] border border-[#202225] rounded p-3 mb-4 border-l-4 border-l-emerald-500">
                        <div className="font-bold text-emerald-400 text-xs mb-1 uppercase">Top Daily Drop</div>
                        <div className="font-bold text-white text-sm mb-1">{report?.biggestDrop?.item.componentName}</div>
                        <div className="text-xs text-[#b9bbbe]">
                          Now: <span className="text-emerald-400 font-bold">${report?.biggestDrop?.item.currentPrice.toFixed(2)}</span> • 
                          Drop: <span className="text-white font-bold">-${Math.abs(report?.biggestDrop?.change24h.amount || 0).toFixed(2)}</span> • 
                          <span className="text-[#00b0f4] ml-1">{report?.biggestDrop?.item.retailer}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs font-bold text-[#8e9297] mb-2 uppercase">Tracked Prices</div>
                    <div className="bg-[#2f3136] rounded p-2 mb-4 font-mono text-[11px]">
                      {report?.items.slice(0, 5).map((itemSummary: DigestItemSummary, idx: number) => (
                        <div key={idx} className="flex justify-between py-1 border-b border-[#202225] last:border-0">
                          <span className="truncate pr-2 text-[#b9bbbe]">{itemSummary.item.componentName.substring(0, 30)}...</span>
                          <span className="text-white font-bold whitespace-nowrap">${itemSummary.item.currentPrice.toFixed(2)}</span>
                        </div>
                      ))}
                      {(report?.items.length || 0) > 5 && <div className="text-[#72767d] text-center pt-1">+ {(report?.items.length || 0) - 5} more items</div>}
                    </div>

                    {report?.items.some((i: DigestItemSummary) => i.alternativePick) && (
                      <div className="bg-[#2f3136] border border-[#202225] rounded p-3 border-l-4 border-l-fuchsia-500">
                        <div className="font-bold text-fuchsia-400 text-xs mb-1 uppercase flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Switch Recommendations
                        </div>
                        {report.items.filter((i: DigestItemSummary) => i.alternativePick).map((i: DigestItemSummary, idx: number) => (
                          <div key={idx} className="text-xs text-[#dcddde] mt-1.5">
                            • Replace <span className="font-bold">{i.item.componentName.split(' ')[0]}</span> with <span className="text-[#00b0f4]">{i.alternativePick?.name}</span> (Save ${i.alternativePick?.savings.toFixed(0)})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
