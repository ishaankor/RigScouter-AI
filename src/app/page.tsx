'use client';

import React, { useState } from 'react';
import { WatchlistManager } from '../components/WatchlistManager';
import { RigBuilderChat } from '../components/RigBuilderChat';
import { DailyDigestPreview } from '../components/DailyDigestPreview';
import { DealRadar } from '../components/DealRadar';
import { Cpu, Bell, Calendar, Flame, Sparkles, Shield, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'builder' | 'digest' | 'radar'>('watchlist');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-heading tracking-tight gradient-text-blue">
                RigScouter<span className="text-white">-AI</span>
              </h1>
              <p className="text-xs text-gray-400">
                PC Hardware Scraper • RAG Build Engine • Automated Daily Price Digest
              </p>
            </div>
          </div>
        </div>

        {/* Top Quick Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-gray-900/80 border border-gray-800 px-3 py-2 rounded-xl text-gray-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Retailers Monitored: <strong className="text-white">6 Stores</strong></span>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 px-3 py-2 rounded-xl text-gray-300">
            Avg. Savings Today: <strong className="text-emerald-400">$45.00</strong>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'watchlist', label: 'Watchlist Tracker', icon: Bell },
          { id: 'builder', label: 'AI Rig Concierge', icon: Cpu },
          { id: 'digest', label: 'Daily Automater Digest', icon: Calendar },
          { id: 'radar', label: 'Flash Deals Radar', icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-gray-950 shadow-lg shadow-cyan-500/25'
                  : 'glass-card text-gray-400 hover:text-white hover:bg-gray-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Views */}
      {activeTab === 'watchlist' && <WatchlistManager />}
      {activeTab === 'builder' && <RigBuilderChat />}
      {activeTab === 'digest' && <DailyDigestPreview />}
      {activeTab === 'radar' && <DealRadar />}

      {/* Persistent Bottom Feature Banner */}
      <footer className="glass-card p-6 border border-gray-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Daily Automater Status:</strong> Active. Your configured price digest will be dispatched via Email / Discord at 08:00 AM UTC.
          </span>
        </div>
        <div className="text-gray-500 font-mono">
          RigScouter-AI v0.1.0 • Powered by Next.js & AI Scraper Engine
        </div>
      </footer>
    </main>
  );
}
