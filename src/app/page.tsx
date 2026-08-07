'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WatchlistManager } from '../components/WatchlistManager';
import { RigBuilderChat } from '../components/RigBuilderChat';
import { DailyDigestPreview } from '../components/DailyDigestPreview';
import { DealRadar } from '../components/DealRadar';
import { AuthModal } from '../components/AuthModal';
import { supabase } from '../lib/db/supabase';
import {
  Cpu,
  Bell,
  Calendar,
  Flame,
  Sparkles,
  ShieldCheck,
  LogIn,
  LogOut,
  ArrowRight,
  Globe,
  Bot,
  Zap,
  CheckCircle2,
  Lock,
  Mail,
  Sliders,
  Award
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'watchlist' | 'builder' | 'digest' | 'radar'>('overview');
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Fetch initial auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
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

        {/* Top User Auth & Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-gray-900/80 border border-gray-800 px-3 py-2 rounded-xl text-gray-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>RLS Security: <strong className="text-emerald-400">Active</strong></span>
          </div>

          {user ? (
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[10px] text-gray-950">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <span className="text-gray-300 font-medium max-w-[140px] truncate">{user.email}</span>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="ml-1 text-gray-400 hover:text-red-400 p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-800/60">
        {[
          { id: 'overview', label: 'Home Overview', icon: Sparkles },
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

        <Link
          href="/features"
          className="px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer glass-card text-purple-300 hover:text-white hover:bg-purple-950/40 border border-purple-500/30"
        >
          <Award className="w-4 h-4 text-purple-400" />
          <span>Features Page ↗</span>
        </Link>
      </div>

      {/* TAB 1: Home Overview & Feature Showcase */}
      {activeTab === 'overview' && (
        <div className="space-y-10 animate-fade-in">
          {/* Hero Section */}
          <div className="glass-card relative overflow-hidden rounded-3xl border border-gray-800 p-8 md:p-12 bg-gradient-to-br from-gray-950 via-cyan-950/20 to-gray-950">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
                24/7 Multi-Retailer Scraper & Autonomous Price Drop Radar
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-white font-heading tracking-tight leading-tight">
                Intelligent PC Deal Finder & Autonomous Price Tracker
              </h2>

              <p className="text-base text-gray-300 leading-relaxed">
                RigScouter-AI scans Micro Center, Amazon, Newegg, Best Buy, and B&H Photo continuously. Save items to your personalized watchlist, receive scheduled daily digests to Email or Discord, and generate AI-verified custom PC builds.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {!user ? (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="btn-glow px-6 py-3.5 text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xl"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In / Create Account
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('watchlist')}
                    className="btn-glow px-6 py-3.5 text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xl"
                  >
                    <Bell className="w-4 h-4" />
                    Open My Watchlist
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('builder')}
                  className="px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl border border-gray-800 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  Launch AI Rig Concierge
                </button>
              </div>
            </div>
          </div>

          {/* 4 Core Features Showcase */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Platform Features & Architecture
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Explore how RigScouter-AI monitors hardware catalog prices and dispatches daily digests</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-4 hover:border-cyan-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Globe className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">1. Autonomous Multi-Retailer Scraper</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Scrapes Micro Center, Amazon, Newegg, Best Buy, and B&H Photo live using Firecrawl & Tavily native LLM extractions. Identifies model groups and partner variants under unified canonical models.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 pt-2">
                  <span>Firecrawl API & Tavily SDK Integrated</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-4 hover:border-purple-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">2. Personalized Watchlist & RLS Security</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Users must be signed in to add items to their personal watchlist. Powered by Supabase Auth and Row Level Security (RLS) to isolate user alerts and target prices.
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Sign In Required
                  </span>
                  <button
                    onClick={() => {
                      if (!user) setAuthModalOpen(true);
                      else setActiveTab('watchlist');
                    }}
                    className="text-xs font-bold text-white hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                  >
                    {user ? 'View Watchlist' : 'Sign In Now'} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-4 hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">3. RAG AI Rig Concierge & Compatibility</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Build custom gaming and workstation PCs with real-time hardware compatibility checks (Socket, TDP wattage, cooler height, GPU length).
                </p>
                <button
                  onClick={() => setActiveTab('builder')}
                  className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-2 cursor-pointer hover:underline"
                >
                  <span>Launch AI Rig Concierge</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 4 */}
              <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-4 hover:border-amber-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">4. Subscribed Daily Digest & Alerts</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Subscribed users receive scheduled daily digests dispatched directly to their Email or Discord webhook. Includes executive price drop summaries and 90-day trend deltas.
                </p>
                <button
                  onClick={() => setActiveTab('digest')}
                  className="flex items-center gap-2 text-xs font-semibold text-amber-400 pt-2 cursor-pointer hover:underline"
                >
                  <span>Manage Digest Subscriptions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Tab Views */}
      {activeTab === 'watchlist' && <WatchlistManager user={user} onOpenAuth={() => setAuthModalOpen(true)} />}
      {activeTab === 'builder' && <RigBuilderChat />}
      {activeTab === 'digest' && <DailyDigestPreview user={user} onOpenAuth={() => setAuthModalOpen(true)} />}
      {activeTab === 'radar' && <DealRadar />}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />

      {/* Persistent Bottom Feature Banner */}
      <footer className="glass-card p-6 border border-gray-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Daily Automater Status:</strong> Active. Your configured price digest will be dispatched via Email / Discord at 08:00 AM UTC.
          </span>
        </div>
        <div className="text-gray-500 font-mono">
          RigScouter-AI v0.1.0 • Powered by Next.js & Supabase Auth (RLS Protected)
        </div>
      </footer>
    </main>
  );
}
