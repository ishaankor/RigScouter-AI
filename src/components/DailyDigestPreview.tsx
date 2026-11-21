'use client';

import React, { useState, useEffect } from 'react';
import { DigestFrequency, ComparisonInterval, DailyDigestReport, DigestItemSummary, WatchlistItem } from '@/lib/types/hardware';
import { generateDailyDigestReport, cleanDisplayTitle } from '@/lib/ai/digest-generator';
import { supabase } from '@/lib/db/supabase';
import { getAuthHeaders } from '@/lib/auth/client-auth';
import {
  Calendar,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  TrendingDown,
  RefreshCw,
  Check,
  LogIn,
  ShieldCheck,
  ExternalLink,
  Clock,
  SlidersHorizontal,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DailyDigestPreviewProps {
  user?: any;
  onOpenAuth?: () => void;
}

export function DailyDigestPreview({ user, onOpenAuth }: DailyDigestPreviewProps) {
  const [frequency, setFrequency] = useState<DigestFrequency>('daily');
  const [deliveryChannel, setDeliveryChannel] = useState<'email' | 'discord'>('email');
  const [customEmail, setCustomEmail] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIntervals, setSelectedIntervals] = useState<ComparisonInterval[]>(['24h', '7d', '30d', 'ATL']);
  const [isSubscribed, setIsSubscribed] = useState(!!user);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  
  const [report, setReport] = useState<DailyDigestReport | null>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchUserWatchlist = async (): Promise<WatchlistItem[]> => {
    if (!user?.id) return [];

    // 1. Fetch from /api/watchlist (uses supabaseAdmin service role with full hardware catalog matching)
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/watchlist?userId=${encodeURIComponent(user.id)}`, {
        headers: authHeaders
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.items) && json.items.length > 0) {
          return json.items.map((item: any) => {
            const rawOffers: any[] = Array.isArray(item.specs?.RetailerOffers) ? item.specs.RetailerOffers : [];
            const validOffers = rawOffers
              .filter((o: any) => o && o.retailer && Number(o.price || 0) > 0)
              .sort((a: any, b: any) => Number(a.price) - Number(b.price));

            const bestOffer = validOffers[0];
            const maxSavings = validOffers.length > 1
              ? Number((Number(validOffers[validOffers.length - 1].price) - Number(bestOffer.price)).toFixed(2))
              : 0;

            const offersList = validOffers.map((o: any) => ({
              retailer: o.retailer,
              price: Number(o.price),
              url: o.url || item.productUrl || '#',
              isLowest: bestOffer ? o.retailer.toLowerCase() === bestOffer.retailer.toLowerCase() : true,
              diffVsLowest: bestOffer ? Number((Number(o.price) - Number(bestOffer.price)).toFixed(2)) : 0
            }));

            return {
              ...item,
              retailer: bestOffer?.retailer || item.retailer || 'Amazon',
              currentPrice: bestOffer ? Number(bestOffer.price) : Number(item.currentPrice || 0),
              productUrl: bestOffer?.url || item.productUrl,
              retailerOffers: offersList.length > 0 ? offersList : [{
                retailer: item.retailer || 'Amazon',
                price: Number(item.currentPrice || 0),
                url: item.productUrl || '#',
                isLowest: true
              }],
              maxSavings
            };
          });
        }
      }
    } catch (err) {
      console.warn('DailyDigestPreview /api/watchlist fetch notice:', err);
    }

    let formatted: WatchlistItem[] = [];

    // 2. Direct Supabase DB Table Query fallback
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
          targetPrice: Number(item.target_price || (price * 0.95)),
          currentPrice: price,
          previousPrice24h: Number(item.previous_price_24h || price),
          previousPrice7d: Number(item.previous_price_7d || price),
          previousPrice30d: Number(item.previous_price_30d || price),
          allTimeLow: item.all_time_low ? Number(item.all_time_low) : 0,
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

    return formatted;
  };

  // 1. Fetch saved user preferences once when authenticated user changes
  useEffect(() => {
    let isMounted = true;
    if (!user?.id) return;

    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data: pref }) => {
        if (!isMounted || !pref) return;
        if (pref.summary_frequency) setFrequency(pref.summary_frequency as DigestFrequency);
        if (pref.comparison_intervals) {
          try {
            const ints = typeof pref.comparison_intervals === 'string' ? JSON.parse(pref.comparison_intervals) : pref.comparison_intervals;
            if (Array.isArray(ints) && ints.length > 0) setSelectedIntervals(ints);
          } catch {}
        }
        if (pref.delivery_channels) {
          try {
            const dc = typeof pref.delivery_channels === 'string' ? JSON.parse(pref.delivery_channels) : pref.delivery_channels;
            if (dc.emailAddress) setCustomEmail(dc.emailAddress);
            const savedWebhook = dc.discord_webhook || dc.discordWebhook;
            if (savedWebhook) setDiscordWebhook(savedWebhook);
            if (dc.discord === true && !dc.email) {
              setDeliveryChannel('discord');
            }
          } catch {}
        }
      });

    return () => { isMounted = false; };
  }, [user?.id]);

  // 2. Fetch user watchlist items once when authenticated user changes
  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setWatchlistItems([]);
      setReport(null);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    fetchUserWatchlist().then(items => {
      if (!isMounted) return;
      setWatchlistItems(items);
      if (items.length === 0) {
        setReport(null);
        setIsGenerating(false);
      }
    });

    return () => { isMounted = false; };
  }, [user?.id]);

  // 3. Generate AI digest preview report whenever watchlist items, frequency, or intervals change
  useEffect(() => {
    let isCurrent = true;
    if (!user?.id || watchlistItems.length === 0) {
      setReport(null);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    generateDailyDigestReport(watchlistItems, frequency, selectedIntervals)
      .then(generated => {
        if (isCurrent) {
          setReport(generated);
          setIsGenerating(false);
        }
      })
      .catch(err => {
        console.error('Digest report generation error:', err);
        if (isCurrent) setIsGenerating(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.id, watchlistItems, frequency, JSON.stringify(selectedIntervals)]);

  const handleRegenerate = async () => {
    if (!user?.id) {
      onOpenAuth?.();
      return;
    }
    setIsGenerating(true);
    const items = await fetchUserWatchlist();
    setWatchlistItems(items);
    if (items.length > 0) {
      const generated = await generateDailyDigestReport(items, frequency, selectedIntervals);
      setReport(generated);
    } else {
      setReport(null);
    }
    setIsGenerating(false);
  };

  // Helper to persist preferences in background without resetting local state
  const persistPreferences = async (
    newFreq: DigestFrequency = frequency,
    newIntervals: ComparisonInterval[] = selectedIntervals,
    newChannel: 'email' | 'discord' = deliveryChannel
  ) => {
    if (!user?.id) return;
    try {
      const routingEmail = customEmail.trim() || user?.email;
      const channels = {
        email: newChannel === 'email',
        emailAddress: routingEmail,
        discord: newChannel === 'discord',
        discord_webhook: discordWebhook.trim()
      };
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/digests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          summary_frequency: newFreq,
          delivery_channels: channels,
          comparison_intervals: newIntervals,
        }),
      });
      if (!res.ok) {
        const { data: existingPref } = await supabase
          .from('user_preferences')
          .select('delivery_channels')
          .eq('user_id', user.id)
          .maybeSingle();
        let existingChannels: Record<string, any> = {};
        if (existingPref?.delivery_channels) {
          try {
            existingChannels = typeof existingPref.delivery_channels === 'string'
              ? JSON.parse(existingPref.delivery_channels)
              : existingPref.delivery_channels;
          } catch {}
        }
        const mergedChannels: Record<string, any> = { ...existingChannels, ...channels };
        if (existingChannels.last_sent_at) {
          mergedChannels.last_sent_at = existingChannels.last_sent_at;
        }
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          summary_frequency: newFreq,
          delivery_channels: JSON.stringify(mergedChannels),
          comparison_intervals: JSON.stringify(newIntervals),
          auto_recommend_alternatives: true,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Auto-save preference notice:', err);
    }
  };

  const handleFrequencyChange = (newFreq: DigestFrequency) => {
    setFrequency(newFreq);
    persistPreferences(newFreq, selectedIntervals, deliveryChannel);
  };

  const handleDeliveryChannelChange = (newChannel: 'email' | 'discord') => {
    setDeliveryChannel(newChannel);
    persistPreferences(frequency, selectedIntervals, newChannel);
  };

  const toggleInterval = (int: ComparisonInterval) => {
    let updated: ComparisonInterval[];
    if (selectedIntervals.includes(int)) {
      if (selectedIntervals.length > 1) {
        updated = selectedIntervals.filter(i => i !== int);
      } else {
        return;
      }
    } else {
      updated = [...selectedIntervals, int];
    }
    setSelectedIntervals(updated);
    persistPreferences(frequency, updated, deliveryChannel);
  };

  const handleSaveSubscription = async () => {
    if (!user && onOpenAuth) {
      onOpenAuth();
      return;
    }
    
    if (deliveryChannel === 'discord' && !discordWebhook.trim()) {
      setSaveNotice('⚠️ Please enter a Discord Webhook URL to receive Discord alerts.');
      setTimeout(() => setSaveNotice(null), 5000);
      return;
    }

    setIsSubscribed(true);
    setIsSaving(true);
    setSaveNotice(null);
    
    try {
      const routingEmail = customEmail.trim() || user?.email;
      const channels = {
        email: deliveryChannel === 'email',
        emailAddress: routingEmail,
        discord: deliveryChannel === 'discord',
        discord_webhook: discordWebhook.trim()
      };

      // 1. Save user preferences to DB via authoritative server route
      const authHeaders = await getAuthHeaders();
      const putRes = await fetch('/api/digests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          summary_frequency: frequency,
          delivery_channels: channels,
          comparison_intervals: selectedIntervals,
        }),
      });

      if (!putRes.ok) {
        const { data: existingPref } = await supabase
          .from('user_preferences')
          .select('delivery_channels')
          .eq('user_id', user.id)
          .maybeSingle();
        let existingChannels: Record<string, any> = {};
        if (existingPref?.delivery_channels) {
          try {
            existingChannels = typeof existingPref.delivery_channels === 'string'
              ? JSON.parse(existingPref.delivery_channels)
              : existingPref.delivery_channels;
          } catch {}
        }
        const mergedChannels: Record<string, any> = { ...existingChannels, ...channels };
        if (existingChannels.last_sent_at) {
          mergedChannels.last_sent_at = existingChannels.last_sent_at;
        }
        const { error } = await supabase.from('user_preferences').upsert({
          user_id: user.id,
          summary_frequency: frequency,
          delivery_channels: JSON.stringify(mergedChannels),
          comparison_intervals: JSON.stringify(selectedIntervals),
          auto_recommend_alternatives: true,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
      }

      // 2. If Discord channel selected, automatically send a confirmation ping to the webhook
      let pingSuccess = false;
      let pingError = '';
      if (deliveryChannel === 'discord' && discordWebhook.trim()) {
        try {
          const authHeaders = await getAuthHeaders();
          const pingRes = await fetch('/api/notifications/test-discord', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ webhookUrl: discordWebhook.trim() })
          });
          const pingData = await pingRes.json();
          if (pingRes.ok && pingData.success) {
            pingSuccess = true;
          } else {
            pingError = pingData.error || 'Failed to ping channel';
          }
        } catch (pingErr: any) {
          pingError = pingErr.message || 'Network error reaching webhook';
        }
      }

      if (deliveryChannel === 'discord') {
        if (pingSuccess) {
          setSaveNotice('✅ Preferences saved! A confirmation ping was dispatched to your Discord channel.');
        } else if (pingError) {
          setSaveNotice(`✅ Preferences saved, but Discord ping failed: ${pingError}. Please verify the webhook URL.`);
        } else {
          setSaveNotice('✅ Preferences saved! Briefs and alerts will route to your Discord Webhook.');
        }
      } else {
        setSaveNotice(`✅ Preferences saved! Digest routes to ${routingEmail} via Email at 08:00 AM UTC.`);
      }
    } catch (e: any) {
      console.error('Error saving preferences', e);
      setSaveNotice(`⚠️ Failed to save preferences to DB: ${e.message || JSON.stringify(e)}`);
    } finally {
      setIsSaving(false);
    }

    setTimeout(() => setSaveNotice(null), 6000);
  };

  const activeRecipient = customEmail.trim() || user?.email || 'you@example.com';
  const frequencyMeta: Record<DigestFrequency, { label: string; sub: string; badge: string; dropLabel: string; savingsLabel: string }> = {
    daily: {
      label: 'Daily Briefing',
      sub: 'Every day at 08:00 UTC',
      badge: 'DAILY BRIEFING',
      dropLabel: '24h Drops',
      savingsLabel: '24h Savings'
    },
    every_3_days: {
      label: 'Every 3 Days',
      sub: '72-hour rolling summary',
      badge: '3-DAY BRIEFING',
      dropLabel: '3d Drops',
      savingsLabel: '3-Day Savings'
    },
    weekly: {
      label: 'Weekly Roundup',
      sub: '7-day market wrap-up',
      badge: 'WEEKLY DIGEST',
      dropLabel: '7d Drops',
      savingsLabel: 'Weekly Savings'
    },
    flash_only: {
      label: 'Flash Drops Only',
      sub: 'Instant all-time low alerts',
      badge: 'FLASH ALERT',
      dropLabel: 'Flash Deals',
      savingsLabel: 'Flash Savings'
    }
  };

  const currentFreqMeta = frequencyMeta[frequency] || frequencyMeta.daily;
  const activeDropsCount = frequency === 'weekly'
    ? (report?.items?.filter(i => (i.change7d?.amount || 0) < 0).length || 0)
    : (report?.items?.filter(i => (i.change24h?.amount || 0) < 0 || (frequency === 'flash_only' && i.isAllTimeLow)).length || 0);

  return (
    <div className="space-y-6 mb-8">
      {/* Guest Sign-In Banner */}
      {!user && (
        <div className="bg-gray-900/90 border border-gray-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                Sign in to activate automated price briefings
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Connect your account to schedule personalized Email or Discord price drop digests for your watchlist.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      )}

      {/* Clean Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold font-heading text-white tracking-tight">
              Automated Price Digest
            </h2>
            {user && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Schedule
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
             Configure automated multi-retailer price briefings and preview your live intelligence report.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-900/70 border border-gray-800/80 px-3 py-2 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dispatches at <strong className="text-gray-200">08:00 UTC</strong></span>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Refresh Preview</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clean Configuration Panel */}
        <div className="lg:col-span-4 bg-gray-950/70 border border-gray-800/80 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800/70">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Delivery Settings
              </h3>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">Auto-saved</span>
          </div>

          {/* 1. Delivery Destination */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-gray-300">
              Delivery Channel
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900/90 border border-gray-800/80 rounded-xl">
              {[
                { id: 'email', label: 'Email Briefing', icon: Mail },
                { id: 'discord', label: 'Discord Webhook', icon: MessageSquare },
              ].map((ch) => {
                const Icon = ch.icon;
                const isSelected = deliveryChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleDeliveryChannelChange(ch.id as any)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gray-800 text-white shadow-sm border border-gray-700/70'
                        : 'text-gray-400 hover:text-gray-200 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-gray-500'}`} />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>

            {deliveryChannel === 'email' ? (
              <div className="pt-1">
                <label className="block text-[11px] text-gray-400 mb-1.5">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  placeholder={user?.email ? user.email : 'Enter email address'}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-gray-900/90 border border-gray-800 focus:border-cyan-500/60 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none placeholder:text-gray-500 transition-colors"
                />
                {user?.email && !customEmail && (
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Defaults to your account email (<span className="text-gray-400">{user.email}</span>).
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-1 space-y-2">
                <label className="block text-[11px] text-gray-400">
                  Discord Channel Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  className="w-full bg-gray-900/90 border border-gray-800 focus:border-cyan-500/60 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none placeholder:text-gray-600 transition-colors font-mono"
                />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  In Discord, open <span className="text-gray-300">Channel Settings &rarr; Integrations &rarr; Webhooks</span> and copy the webhook URL. Saving dispatches a test ping.
                </p>
              </div>
            )}
          </div>

          {/* 2. Summary Frequency */}
          <div className="pt-4 border-t border-gray-800/70 space-y-2.5">
            <label className="block text-xs font-semibold text-gray-300">
              Dispatch Cadence
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(['daily', 'every_3_days', 'weekly', 'flash_only'] as DigestFrequency[]).map((freqId) => {
                const meta = frequencyMeta[freqId];
                const isSelected = frequency === freqId;
                return (
                  <button
                    key={freqId}
                    type="button"
                    onClick={() => handleFrequencyChange(freqId)}
                    className={`px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-white'
                        : 'bg-gray-900/50 border-gray-800/80 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-semibold ${isSelected ? 'text-cyan-300' : 'text-gray-200'}`}>
                        {meta.label}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {meta.sub}
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-gray-700'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Comparison Benchmarks */}
          <div className="pt-4 border-t border-gray-800/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-300">
                Historical Benchmarks
              </label>
              <span className="text-[11px] text-gray-500">
                {selectedIntervals.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: '24h', label: '24h Delta' },
                { id: '7d', label: '7-Day Trend' },
                { id: '30d', label: '30-Day Trend' },
                { id: 'ATL', label: '90d Low (ATL)' },
              ] as { id: ComparisonInterval; label: string }[]).map(({ id, label }) => {
                const active = selectedIntervals.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleInterval(id)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      active
                        ? 'bg-gray-900 text-gray-100 border-gray-700'
                        : 'bg-gray-950/60 text-gray-500 border-gray-800/60 hover:text-gray-300 hover:border-gray-800'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                      active ? 'bg-cyan-500 text-gray-950' : 'border border-gray-700'
                    }`}>
                      {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Save Action */}
          <div className="pt-2">
            <button
              onClick={handleSaveSubscription}
              disabled={isSaving}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                {isSaving
                  ? (deliveryChannel === 'discord' ? 'Saving & Testing Webhook...' : 'Saving Preferences...')
                  : user ? 'Save Digest Preferences' : 'Sign In to Subscribe'}
              </span>
            </button>

            {saveNotice && (
              <div className={`mt-3 text-xs font-medium p-3 rounded-xl border flex items-start gap-2 ${
                saveNotice.includes('⚠️') || saveNotice.includes('failed')
                  ? 'text-amber-300 bg-amber-950/40 border-amber-800/50'
                  : 'text-emerald-300 bg-emerald-950/40 border-emerald-800/50'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{saveNotice.replace(/^[✅⚠️]\s*/, '')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Briefing Preview */}
        <div className="lg:col-span-8 bg-gray-950/70 border border-gray-800/80 rounded-2xl overflow-hidden">
          {/* Preview Window Top Bar */}
          <div className="px-5 py-3.5 bg-gray-900/70 border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
              </div>
              <span className="text-xs font-semibold text-gray-300 pl-1">
                Live Briefing Preview
              </span>
              <span className="text-[11px] font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                {currentFreqMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Channel: <strong className="text-gray-200 capitalize">{deliveryChannel}</strong></span>
            </div>
          </div>

          {/* Preview Content Body */}
          <div className="p-5 sm:p-6">
            {!user ? (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-cyan-400">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="text-base font-bold text-white">Sign In to Preview Your Briefing</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your digest is generated directly from your personal watchlist components and historical price snapshots.
                  </p>
                </div>
                <button
                  onClick={onOpenAuth}
                  className="mt-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            ) : isGenerating ? (
              <div className="py-20 px-6 text-center flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Compiling Hardware Intelligence...</h3>
                  <p className="text-xs text-gray-400">Evaluating multi-retailer price deltas across your tracked components</p>
                </div>
              </div>
            ) : !report || !report.items || report.items.length === 0 ? (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="text-base font-bold text-white">No Watchlist Components Tracked</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Add components in the <strong className="text-gray-200">Watchlist Tracker</strong> tab to generate your personalized daily price digest.
                  </p>
                </div>
              </div>
            ) : deliveryChannel === 'email' ? (
              /* ================= CLEAN EXECUTIVE EMAIL BRIEFING ================= */
              <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl overflow-hidden">
                {/* Email Envelope Header */}
                <div className="px-5 py-4 bg-gray-900/70 border-b border-gray-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold tracking-tight text-white">
                        RigScouter<span className="text-cyan-400">-AI</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded">
                        {currentFreqMeta.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • 08:00 UTC
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {report.headline}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 pt-0.5">
                    <span>From: <strong className="text-gray-300 font-medium">rigscouter@ishaankoradia.com</strong></span>
                    <span>To: <strong className="text-gray-300 font-medium">{activeRecipient}</strong></span>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* KPI Summary Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3.5">
                      <div className="text-[11px] font-medium text-gray-400">Monitored Parts</div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        {report.items.length}
                      </div>
                    </div>
                    <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3.5">
                      <div className="text-[11px] font-medium text-gray-400">{currentFreqMeta.dropLabel}</div>
                      <div className={`text-lg font-bold mt-0.5 ${activeDropsCount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {activeDropsCount}
                      </div>
                    </div>
                    <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3.5">
                      <div className="text-[11px] font-medium text-gray-400">{currentFreqMeta.savingsLabel}</div>
                      <div className={`text-lg font-bold mt-0.5 ${Number(report.totalSavedOpportunity || 0) > 0 ? 'text-cyan-400' : 'text-white'}`}>
                        ${Number(report.totalSavedOpportunity || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Executive Summary Callout */}
                  <div className="bg-gray-950/70 border border-gray-800/80 border-l-2 border-l-cyan-400 rounded-xl p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Executive Market Summary</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {report.executiveSummary}
                    </p>
                  </div>

                  {/* Top Price Drop Highlight (if any) */}
                  {report.biggestDrop && (
                    <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                            <ArrowDownRight className="w-3 h-3" />
                            Biggest Price Drop
                          </span>
                          {report.biggestDrop.isAllTimeLow && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded">
                              90d All-Time Low
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white">
                          {cleanDisplayTitle(report.biggestDrop.item?.componentName || '')}
                        </h3>
                        <div className="text-xs text-gray-400">
                          Best offer on <strong className="text-gray-200">{report.biggestDrop.item?.retailer}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-extrabold text-emerald-400">
                            ${Number(report.biggestDrop.item?.currentPrice || 0).toFixed(2)}
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-300">
                            -${Math.abs(frequency === 'weekly' ? (report.biggestDrop.change7d?.amount || 0) : (report.biggestDrop.change24h?.amount || 0)).toFixed(2)} drop
                          </div>
                        </div>
                        {report.biggestDrop.item?.productUrl && report.biggestDrop.item.productUrl !== '#' && (
                          <a
                            href={report.biggestDrop.item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <span>View Deal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tracked Watchlist Breakdown */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-0.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Tracked Components ({report.items.length})
                      </h4>
                      <span className="text-[11px] text-gray-500">
                        Click any store pill to open direct listing
                      </span>
                    </div>

                    <div className="divide-y divide-gray-800/70 border border-gray-800/80 rounded-xl bg-gray-950/60 overflow-hidden">
                      {report.items.map((itemSummary: DigestItemSummary) => {
                        const item = itemSummary.item;
                        const cleanName = cleanDisplayTitle(item?.componentName || '');
                        const curr = Number(item?.currentPrice || 0);
                        const p24 = Number(item?.previousPrice24h || 0);
                        const p7 = Number(item?.previousPrice7d || 0);
                        const p30 = Number(item?.previousPrice30d || 0);
                        const atl = Number(item?.allTimeLow || 0);
                        const displayDrop = frequency === 'weekly' ? (itemSummary.change7d?.amount || 0) : (itemSummary.change24h?.amount || 0);
                        const isDrop = displayDrop < -0.01;
                        const isInStock = item?.inStock !== false;

                        return (
                          <div key={item?.id || cleanName} className="p-4 hover:bg-gray-900/40 transition-colors space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              {/* Left: Category + Name */}
                              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                <span className="px-2 py-0.5 bg-gray-900 text-cyan-400 text-[10px] font-bold uppercase tracking-wider rounded border border-gray-800 shrink-0">
                                  {item?.category || 'Hardware'}
                                </span>
                                <a
                                  href={item?.productUrl && item.productUrl !== '#' ? item.productUrl : undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-white hover:text-cyan-300 text-xs sm:text-sm truncate transition-colors"
                                  title={item?.componentName}
                                >
                                  {cleanName}
                                </a>
                              </div>

                              {/* Right: Current Price & Status */}
                              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                                {isInStock ? (
                                  <>
                                    {isDrop ? (
                                      <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                                        -${Math.abs(displayDrop).toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 text-[11px] font-medium">
                                        Held steady
                                      </span>
                                    )}
                                    <span className="font-bold text-white text-sm sm:text-base tabular-nums">
                                      ${curr.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-rose-400 font-semibold text-[11px] bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/50">
                                      Out of Stock
                                    </span>
                                    <span className="font-bold text-gray-500 line-through text-sm tabular-nums">
                                      ${curr.toFixed(2)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Bottom row: Store comparison links + Selected Historical Benchmarks */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              {/* Store Pills */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item?.retailerOffers && item.retailerOffers.length > 0 ? (
                                  item.retailerOffers.map((off: any) => (
                                    <a
                                      key={off.retailer}
                                      href={off.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                                        off.isLowest
                                          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:border-emerald-600'
                                          : 'bg-gray-900/80 text-gray-400 border-gray-800 hover:text-gray-200 hover:border-gray-700'
                                      }`}
                                    >
                                      <span>{off.retailer}: ${Number(off.price).toFixed(2)}</span>
                                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                    </a>
                                  ))
                                ) : (
                                  <a
                                    href={item?.productUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-900/80 text-gray-300 border border-gray-800 hover:border-gray-700"
                                  >
                                    <span>{item?.retailer || 'Store'}: ${curr.toFixed(2)}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                  </a>
                                )}
                              </div>

                              {/* Dynamic Historical Benchmarks based on selectedIntervals */}
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 font-mono">
                                {selectedIntervals.includes('24h') && p24 > 0 && (
                                  <span>24h: <strong className="text-gray-300 font-medium">${p24.toFixed(2)}</strong></span>
                                )}
                                {selectedIntervals.includes('7d') && p7 > 0 && (
                                  <span>7d: <strong className="text-gray-300 font-medium">${p7.toFixed(2)}</strong></span>
                                )}
                                {selectedIntervals.includes('30d') && p30 > 0 && (
                                  <span>30d: <strong className="text-gray-300 font-medium">${p30.toFixed(2)}</strong></span>
                                )}
                                {selectedIntervals.includes('ATL') && atl > 0 && (
                                  <span>ATL: <strong className="text-cyan-400 font-medium">${atl.toFixed(2)}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= DISCORD WEBHOOK EMBED PREVIEW ================= */
              <div className="bg-[#313338] rounded-xl p-4 sm:p-5 border border-[#1e1f22] font-sans">
                {/* Bot Header */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <img
                    src="/icon.png"
                    alt="RigScouter Bot"
                    className="w-8 h-8 rounded-full object-cover bg-[#2b2d31] border border-white/10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/favicon.png';
                    }}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">RigScouter AI</span>
                    <span className="bg-[#5865F2] text-white text-[10px] px-1.5 py-0.2 rounded font-bold uppercase flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" /> APP
                    </span>
                    <span className="text-xs text-[#949ba4] ml-1">Today at 08:00 AM</span>
                  </div>
                </div>

                {/* Discord Rich Embed Card */}
                <div className="ml-10 bg-[#2b2d31] rounded-lg border-l-4 border-l-[#38bdf8] p-4 max-w-2xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#38bdf8]">
                      ⚡ RigScouter {currentFreqMeta.label}
                    </span>
                    <span className="text-[11px] text-[#949ba4]">
                      {report.items.length} Tracked • {activeDropsCount} Drop(s)
                    </span>
                  </div>

                  <div className="font-bold text-white text-sm sm:text-base leading-snug">
                    {report.headline}
                  </div>

                  <p className="text-xs text-[#dbdee1] leading-relaxed">
                    {report.executiveSummary}
                  </p>

                  {/* Structured Component Embed Fields */}
                  <div className="space-y-2 pt-1">
                    {report.items.map((itemSummary: DigestItemSummary, idx: number) => {
                      const item = itemSummary.item;
                      const cleanName = cleanDisplayTitle(item?.componentName || '');
                      const curr = Number(item?.currentPrice || 0);
                      const displayDrop = frequency === 'weekly' ? (itemSummary.change7d?.amount || 0) : (itemSummary.change24h?.amount || 0);
                      const isDrop = displayDrop < -0.01;

                      return (
                        <div key={item?.id || idx} className="bg-[#1e1f22]/70 rounded-md p-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <a
                              href={item?.productUrl && item.productUrl !== '#' ? item.productUrl : undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[#00a8fc] hover:underline truncate block"
                            >
                              {cleanName}
                            </a>
                            <span className="text-[11px] text-[#949ba4]">
                              {item?.category || 'Hardware'} • Best on <strong className="text-[#dbdee1]">{item?.retailer || 'Store'}</strong>
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-white tabular-nums">${curr.toFixed(2)}</div>
                            {isDrop ? (
                              <div className="text-[10px] font-bold text-emerald-400">
                                -${Math.abs(displayDrop).toFixed(2)}
                              </div>
                            ) : (
                              <div className="text-[10px] text-[#949ba4]">Stable</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#949ba4]">
                    <span>RigScouter AI Automated Market Engine</span>
                    <span>Next dispatch: 08:00 UTC</span>
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
