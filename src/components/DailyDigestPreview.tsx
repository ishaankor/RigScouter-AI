'use client';

import React, { useState, useEffect } from 'react';
import { DigestFrequency, ComparisonInterval, DailyDigestReport, DigestItemSummary, WatchlistItem } from '@/lib/types/hardware';
import { generateDailyDigestReport, cleanDisplayTitle } from '@/lib/ai/digest-generator';
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

  const fetchUserWatchlist = async (): Promise<WatchlistItem[]> => {
    if (!user?.id) return [];

    let formatted: WatchlistItem[] = [];

    // 1. Direct Supabase DB Table Query for user watchlist items
    const { data: dbItems, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    if (!error && dbItems && dbItems.length > 0) {
      formatted = dbItems.map(item => {
        const price = Number(item.current_price || item.all_time_low || item.target_price || 100);
        return {
          id: item.id,
          userId: item.user_id,
          componentName: item.component_name || 'Hardware Component',
          category: item.category || 'GPU',
          targetPrice: Number(item.target_price || (price * 0.9)),
          currentPrice: price,
          previousPrice24h: Number(item.previous_price_24h || price),
          previousPrice7d: Number(item.previous_price_7d || price),
          previousPrice30d: Number(item.previous_price_30d || price),
          allTimeLow: Number(item.all_time_low || price),
          retailer: item.retailer || 'Amazon',
          productUrl: item.product_url || '#',
          imageUrl: item.image_url,
          inStock: item.in_stock ?? true,
          notifyOnFlashDrop: item.notify_on_flash_drop ?? true,
          addedAt: item.added_at,
          specs: item.specs
        };
      });
    }

    // 2. Also check hardware_components for items user added (specs.user_watchlist === user.id)
    const { data: hwData } = await supabase.from('hardware_components').select('*');
    if (hwData && hwData.length > 0) {
      const userHw = hwData.filter(item => {
        try {
          const specs = typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {});
          return specs.user_watchlist === user.id;
        } catch {
          return false;
        }
      });
      for (const item of userHw) {
        const price = Number(item.current_price || 100);
        if (!formatted.some(f => (f.componentName || '').toLowerCase() === (item.name || '').toLowerCase())) {
          formatted.push({
            id: `hw-${item.id}`,
            userId: user.id,
            componentName: item.name,
            category: item.category || 'GPU',
            targetPrice: Number(item.msrp ? item.msrp * 0.9 : price * 0.9),
            currentPrice: price,
            previousPrice24h: price,
            previousPrice7d: price,
            previousPrice30d: price,
            allTimeLow: Number(item.lowest_price_90d || price),
            retailer: item.retailer || 'Amazon',
            productUrl: item.product_url || '#',
            imageUrl: item.image_url,
            inStock: true,
            notifyOnFlashDrop: true,
            addedAt: item.updated_at,
            specs: item.specs
          });
        }
      }
    }

    return formatted;
  };

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setReport(null);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    fetchUserWatchlist().then(async items => {
      if (isMounted) {
        if (items.length > 0) {
          const generated = await generateDailyDigestReport(items);
          if (isMounted) setReport(generated);
        } else {
          setReport(null);
        }
        setIsGenerating(false);
      }
    });
    return () => { isMounted = false; };
  }, [user?.id]);

  const handleRegenerate = async () => {
    if (!user?.id) {
      onOpenAuth?.();
      return;
    }
    setIsGenerating(true);
    const items = await fetchUserWatchlist();
    if (items.length > 0) {
      const generated = await generateDailyDigestReport(items);
      setReport(generated);
    } else {
      setReport(null);
    }
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
            {!user ? (
              /* Signed Out CTA */
              <div className="bg-gradient-to-b from-gray-900 to-[#121216] p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
                  <LogIn className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-xl font-bold font-heading text-white">Sign In to View Daily Digest</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    The Daily Digest dynamically analyzes and summarizes price movements exclusively for your tracked watchlist items.
                  </p>
                </div>
                <button
                  onClick={onOpenAuth}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-gray-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            ) : isGenerating ? (
              /* Loading State */
              <div className="bg-gradient-to-b from-gray-900 to-[#121216] p-16 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <h3 className="text-base font-bold text-white">Generating AI Daily Intelligence...</h3>
                <p className="text-xs text-gray-400">Analyzing your personal tracked hardware across multi-retailer intervals</p>
              </div>
            ) : !report || !report.items || report.items.length === 0 ? (
              /* Logged In with Empty Watchlist */
              <div className="bg-gradient-to-b from-gray-900 to-[#121216] p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 shadow-lg">
                  <Calendar className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-xl font-bold font-heading text-white">No Tracked Components Found</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your personal watchlist has 0 tracked items. Add components in the <strong>Watchlist Tracker</strong> tab to generate your real-time daily price digest.
                  </p>
                </div>
              </div>
            ) : deliveryChannel === 'email' ? (
              // ================= EMAIL MOCKUP =================
              <div className="bg-gradient-to-b from-gray-900 to-[#121216] p-8 rounded-2xl shadow-2xl mx-auto border border-gray-800/80">
                <div className="text-center mb-8 pb-6 border-b border-gray-800/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        ⚡ RigScouter AI
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      LIVE BRIEFING
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-3">{report ? report.headline : 'Generating intelligence...'}</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Automated Hardware Intelligence &bull; Today at 8:00 AM</p>
                </div>

                {/* Metrics Dashboard */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 rounded-xl border border-white/5 text-center mb-6">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Tracked</div>
                    <div className="text-sm font-black text-white mt-0.5">{report?.items?.length || 0} Items</div>
                  </div>
                  <div className="border-x border-white/5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Drops</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">
                      {report?.items?.filter(i => (i.change24h?.amount || 0) < 0).length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">24h Savings</div>
                    <div className="text-sm font-black text-cyan-400 mt-0.5">${Number(report?.totalSavedOpportunity || 0).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="space-y-6 text-sm">
                  <div className="bg-black/30 border-l-4 border-l-cyan-500 rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1">Market Summary</div>
                    <p className="text-gray-300 text-xs leading-relaxed">{report ? report.executiveSummary : 'Analyzing market data and formulating strategy...'}</p>
                  </div>

                  {report?.biggestDrop && (
                    <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 p-5 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.15)] transform transition-all duration-300 hover:scale-[1.01]">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-emerald-400 font-black tracking-wider text-[10px] uppercase bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                              ↘ Top Daily Drop
                            </span>
                            {report?.biggestDrop?.isAllTimeLow && (
                              <span className="bg-purple-950 text-purple-300 text-[10px] px-2 py-0.5 rounded font-black border border-purple-800/40">
                                🔥 90D ALL-TIME LOW
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-extrabold text-white">
                            {cleanDisplayTitle(report?.biggestDrop?.item?.componentName || '')}
                          </h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 p-3 bg-black/50 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[10px] font-bold uppercase">New Price</span>
                          <span className="text-emerald-400 font-black text-base">${Number(report?.biggestDrop?.item?.currentPrice || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[10px] font-bold uppercase">24h Drop</span>
                          <span className="text-white font-bold text-base">-${Math.abs(report?.biggestDrop?.change24h?.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[10px] font-bold uppercase">Retailer</span>
                          <span className="text-cyan-400 font-bold text-base truncate">{report?.biggestDrop?.item?.retailer || 'Store'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interval Comparison Breakdown Table */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-3 ml-1">
                      Tracked Watchlist Intelligence ({report?.items?.length || 0})
                    </h4>
                    <div className="space-y-2.5">
                      {report?.items?.map((itemSummary: DigestItemSummary) => {
                        const cleanName = cleanDisplayTitle(itemSummary?.item?.componentName || '');
                        const p30 = Number(itemSummary?.item?.previousPrice30d || 0);
                        const p7 = Number(itemSummary?.item?.previousPrice7d || 0);
                        const p24 = Number(itemSummary?.item?.previousPrice24h || 0);
                        const curr = Number(itemSummary?.item?.currentPrice || 0);
                        const isDrop = (itemSummary?.change24h?.amount || 0) < 0;

                        return (
                          <div key={itemSummary?.item?.id || Math.random()} className="bg-black/30 p-3.5 rounded-xl border border-white/5 hover:border-cyan-800/40 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-400 text-[10px] font-bold rounded border border-cyan-800/40">
                                  {itemSummary?.item?.category || 'GPU'}
                                </span>
                                <span className="font-bold text-white text-xs">{cleanName}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-black text-white text-sm">${curr.toFixed(2)}</span>
                                {isDrop ? (
                                  <span className="text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                                    -${Math.abs(itemSummary.change24h.amount).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 font-medium text-xs">Stable</span>
                                )}
                                <span className="text-gray-400 text-xs px-2 py-0.5 bg-gray-900 rounded border border-gray-800">
                                  {itemSummary?.item?.retailer || 'Store'}
                                </span>
                              </div>
                            </div>

                            {/* Mini price trajectory */}
                            {(p30 > 0 || p7 > 0 || p24 > 0) && (
                              <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                <span className="uppercase text-gray-600 font-bold">History:</span>
                                {p30 > 0 && <span>30d: <strong className="text-gray-400">${p30.toFixed(0)}</strong></span>}
                                {p7 > 0 && <span>&rarr; 7d: <strong className="text-gray-400">${p7.toFixed(0)}</strong></span>}
                                {p24 > 0 && <span>&rarr; 24h: <strong className="text-gray-400">${p24.toFixed(0)}</strong></span>}
                                <span className="text-emerald-400 font-bold">&rarr; Now: ${curr.toFixed(0)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {report?.items?.some((i: DigestItemSummary) => i.alternativePick) && (
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
                            Replace <span className="font-bold text-white">{cleanDisplayTitle(i.item?.componentName || '')}</span> with <span className="font-bold text-cyan-400">{i.alternativePick?.name}</span> to save <span className="text-emerald-400 font-black">${Number(i.alternativePick?.savings || 0).toFixed(2)}</span>.
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
                        <div className="font-bold text-white text-sm mb-1">{cleanDisplayTitle(report?.biggestDrop?.item?.componentName || '')}</div>
                        <div className="text-xs text-[#b9bbbe]">
                          Now: <span className="text-emerald-400 font-bold">${Number(report?.biggestDrop?.item?.currentPrice || 0).toFixed(2)}</span> • 
                          Drop: <span className="text-white font-bold">-${Math.abs(report?.biggestDrop?.change24h?.amount || 0).toFixed(2)}</span> • 
                          <span className="text-[#00b0f4] ml-1">{report?.biggestDrop?.item?.retailer || 'Store'}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs font-bold text-[#8e9297] mb-2 uppercase">Tracked Prices</div>
                    <div className="bg-[#2f3136] rounded p-2 mb-4 font-mono text-[11px]">
                      {report?.items?.map((itemSummary: DigestItemSummary, idx: number) => (
                        <div key={idx} className="flex justify-between py-1 border-b border-[#202225] last:border-0">
                          <span className="truncate pr-2 text-[#b9bbbe]">{cleanDisplayTitle(itemSummary?.item?.componentName || '')}</span>
                          <span className="text-white font-bold whitespace-nowrap">${Number(itemSummary?.item?.currentPrice || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {report?.items?.some((i: DigestItemSummary) => i.alternativePick) && (
                      <div className="bg-[#2f3136] border border-[#202225] rounded p-3 border-l-4 border-l-fuchsia-500">
                        <div className="font-bold text-fuchsia-400 text-xs mb-1 uppercase flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Switch Recommendations
                        </div>
                        {report.items.filter((i: DigestItemSummary) => i.alternativePick).map((i: DigestItemSummary, idx: number) => (
                          <div key={idx} className="text-xs text-[#dcddde] mt-1.5">
                            • Replace <span className="font-bold">{cleanDisplayTitle(i.item?.componentName || '').split(' ')[0]}</span> with <span className="text-[#00b0f4]">{i.alternativePick?.name}</span> (Save ${Number(i.alternativePick?.savings || 0).toFixed(0)})
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
