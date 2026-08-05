'use client';

import React, { useState } from 'react';
import { DigestFrequency, ComparisonInterval, DailyDigestReport, DigestItemSummary } from '@/lib/types/hardware';
import { generateDailyDigestReport } from '@/lib/ai/digest-generator';
import { MOCK_INITIAL_WATCHLIST } from '@/lib/scrapers/price-scraper';
import { Calendar, Mail, MessageSquare, Send, Sparkles, TrendingDown, RefreshCw, Check, ArrowRight } from 'lucide-react';

export function DailyDigestPreview() {
  const [frequency, setFrequency] = useState<DigestFrequency>('daily');
  const [deliveryChannel, setDeliveryChannel] = useState<'email' | 'discord' | 'telegram'>('email');
  const [selectedIntervals, setSelectedIntervals] = useState<ComparisonInterval[]>(['24h', '7d', '30d', 'ATL']);
  
  const [report, setReport] = useState<DailyDigestReport>(
    generateDailyDigestReport(MOCK_INITIAL_WATCHLIST)
  );

  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setReport(generateDailyDigestReport(MOCK_INITIAL_WATCHLIST));
      setIsGenerating(false);
    }, 400);
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

        <button
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${isGenerating ? 'animate-spin' : ''}`} />
          Run Automater Cycle Now
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Configuration */}
        <div className="lg:col-span-4 bg-gray-900/60 p-5 rounded-xl border border-gray-800 space-y-5">
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
                  className={`p-2 text-xs font-semibold rounded-lg border text-left transition-all ${
                    frequency === item.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
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
                    className={`p-2 text-xs font-semibold rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      deliveryChannel === ch.id
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-gray-950 text-gray-500 border-gray-800'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {int === 'ATL' ? 'vs All-Time Low' : `vs ${int}`}
                  </button>
                );
              })}
            </div>
          </div>
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

          {/* Digest Email/Message Body Mock */}
          <div className="space-y-4 text-sm">
            <h3 className="text-lg font-bold text-white font-heading">
              {report.headline}
            </h3>

            <div className="p-3 bg-gray-900/90 rounded-xl border border-gray-800 text-gray-300 text-xs leading-relaxed">
              {report.executiveSummary}
            </div>

            {/* Biggest Price Drop Highlight Card */}
            {report.biggestDrop && (
              <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/30 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" /> Top Daily Deal Drop
                  </div>
                  {report.biggestDrop.isAllTimeLow && (
                    <span className="bg-emerald-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded">
                      ALL-TIME LOW
                    </span>
                  )}
                </div>
                <div className="font-bold text-white text-base mt-1">
                  {report.biggestDrop.item.componentName}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-300 mt-2">
                  <div>
                    Price Today: <span className="font-bold text-emerald-400 text-sm">${report.biggestDrop.item.currentPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    24h Drop: <span className="font-bold text-white">-${Math.abs(report.biggestDrop.change24h.amount).toFixed(2)} ({report.biggestDrop.change24h.percentage}%)</span>
                  </div>
                  <div>
                    Store: <span className="text-cyan-400">{report.biggestDrop.item.retailer}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interval Comparison Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Tracked Items Price Deltas</h4>
              <div className="space-y-2">
                {report.items.map((itemSummary: DigestItemSummary) => (
                  <div
                    key={itemSummary.item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-900/40 p-3 rounded-lg border border-gray-800 text-xs"
                  >
                    <div className="font-medium text-white mb-1 sm:mb-0">
                      {itemSummary.item.componentName}
                    </div>
                    <div className="flex items-center gap-4 text-gray-300">
                      <span className="font-bold text-white">${itemSummary.item.currentPrice.toFixed(2)}</span>
                      {selectedIntervals.includes('24h') && (
                        <span className={itemSummary.change24h.amount <= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                          24h: {itemSummary.change24h.amount <= 0 ? '' : '+'}${itemSummary.change24h.amount.toFixed(2)}
                        </span>
                      )}
                      {selectedIntervals.includes('7d') && (
                        <span className={itemSummary.change7d.amount <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          7d: {itemSummary.change7d.amount <= 0 ? '' : '+'}${itemSummary.change7d.amount.toFixed(2)}
                        </span>
                      )}
                      {selectedIntervals.includes('ATL') && itemSummary.isAllTimeLow && (
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          ATL
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart AI Alternatives */}
            {report.items.some((i: DigestItemSummary) => i.alternativePick) && (
              <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl text-xs">
                <div className="font-bold text-purple-300 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Recommended Switch
                </div>
                {report.items.filter((i: DigestItemSummary) => i.alternativePick).map((i: DigestItemSummary, idx: number) => (
                  <div key={idx} className="text-gray-300">
                    Replace <span className="font-semibold text-white">{i.item.componentName}</span> with{' '}
                    <span className="font-bold text-cyan-400">{i.alternativePick?.name}</span> (${i.alternativePick?.price}) to save{' '}
                    <span className="text-emerald-400 font-bold">${i.alternativePick?.savings.toFixed(2)}</span>.
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
