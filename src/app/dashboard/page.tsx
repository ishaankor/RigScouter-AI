'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WatchlistManager } from '../../components/WatchlistManager';
import { DailyDigestPreview } from '../../components/DailyDigestPreview';
import { AuthModal } from '../../components/AuthModal';
import { supabase } from '../../lib/db/supabase';
import {
  Cpu,
  Bell,
  Sparkles,
  ShieldCheck,
  LogIn,
  LogOut,
  ArrowLeft,
  Flame,
  Globe,
  Radio,
  SlidersHorizontal,
  Mail
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'digest'>('watchlist');
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Fetch initial auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    }).catch(() => {
      setIsAuthLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <main id="main-content" className="dashboard-layout">
      {/* Top Header Navigation */}
      <header className="dashboard-header" role="banner">
        <nav aria-label="Breadcrumb navigation" className="dashboard-brand-group">
          <Link
            href="/"
            aria-label="Return to RigScouter AI home page"
            className="dashboard-back-link group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Home</span>
          </Link>

          <Link href="/" aria-label="RigScouter AI Home" className="dashboard-brand-link group">
            <div className="dashboard-brand-badge group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="dashboard-brand-text">
              RigScouter<span className="dashboard-brand-cyan">-AI</span>
            </span>
          </Link>
        </nav>

        {/* Top User Auth & Security Status */}
        <div className="dashboard-actions-group">
          <Link
            href="/features"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent hover:border-gray-800 transition-all font-medium"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Features</span>
          </Link>

          <div className="dashboard-status-chip">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>RLS Security: <strong className="text-emerald-400">Active</strong></span>
          </div>

          {user ? (
            <div className="dashboard-user-card">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[10px] text-gray-950">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <span className="text-gray-300 font-medium max-w-[140px] truncate">{user.email}</span>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign out of account"
                className="ml-1 text-gray-400 hover:text-red-400 p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              aria-label="Sign in or register an account"
              className="dashboard-auth-btn"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* Semantic Hero & Overview Section (Fixes Heading Hierarchy, Structure & Text-to-HTML Ratio) */}
      <section className="dashboard-hero-section" aria-labelledby="dashboard-title">
        <div className="dashboard-hero-header">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>Autonomous PC Hardware Market Intelligence</span>
          </div>
          <h1 id="dashboard-title" className="dashboard-page-title">
            Hardware Intelligence &amp; Deal Tracking Dashboard
          </h1>
          <p className="dashboard-page-description">
            Continuous multi-retailer pricing pipeline monitoring Amazon, eBay, Best Buy, and Micro Center in real time.
            Compute algorithmic deal scores against historic all-time-low benchmarks, configure custom price drop triggers,
            and inspect automated morning market intelligence briefings.
          </p>
        </div>

        {/* Semantic Overview Statistics Grid */}
        <div className="dashboard-metrics-overview" aria-label="System architecture overview">
          <article className="dashboard-metric-tile">
            <span className="dashboard-metric-label flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400" /> Retailers Tracked
            </span>
            <span className="dashboard-metric-value">Amazon, eBay &amp; Best Buy</span>
          </article>
          <article className="dashboard-metric-tile">
            <span className="dashboard-metric-label flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" /> Deal Scoring Engine
            </span>
            <span className="dashboard-metric-value">Multi-Factor (0–100 Scale)</span>
          </article>
          <article className="dashboard-metric-tile">
            <span className="dashboard-metric-label flex items-center gap-1.5">
              <Bell className="w-3 h-3 text-cyan-400" /> Price Drop Triggers
            </span>
            <span className="dashboard-metric-value">24h / 7d / 30d Historical Deltas</span>
          </article>
          <article className="dashboard-metric-tile">
            <span className="dashboard-metric-label flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-cyan-400" /> Automated Dispatch
            </span>
            <span className="dashboard-metric-value">Discord Webhook &amp; 08:00 UTC Digest</span>
          </article>
        </div>
      </section>

      {/* Navigation Tabs (Accessible Segmented Control) */}
      <nav role="tablist" aria-label="Dashboard views navigation" className="dashboard-tab-nav">
        <div className="dashboard-tab-bar">
          {[
            { id: 'watchlist', label: 'Watchlist Tracker', icon: Bell, panelId: 'panel-watchlist' },
            { id: 'digest', label: 'Daily Digest', icon: Sparkles, isAI: true, panelId: 'panel-digest' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={tab.panelId}
                tabIndex={isActive ? 0 : -1}
                data-state={isActive ? 'active' : 'inactive'}
                onClick={() => setActiveTab(tab.id as any)}
                className="dashboard-tab-btn"
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-100" />
                )}
                <Icon className={`w-4 h-4 z-10 ${tab.isAI && !isActive ? 'text-purple-400 opacity-70' : 'z-10'}`} />
                <span className="z-10">{tab.label}</span>
                {tab.isAI && (
                  <span className="z-10 ml-1.5 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] uppercase tracking-wider font-extrabold border border-purple-500/30">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Dynamic Tab Panels with ARIA Attributes */}
      <section
        id="panel-watchlist"
        role="tabpanel"
        aria-labelledby="tab-watchlist"
        tabIndex={0}
        hidden={activeTab !== 'watchlist'}
      >
        {activeTab === 'watchlist' && (
          <WatchlistManager user={user} isAuthLoading={isAuthLoading} onOpenAuth={() => setAuthModalOpen(true)} />
        )}
      </section>

      <section
        id="panel-digest"
        role="tabpanel"
        aria-labelledby="tab-digest"
        tabIndex={0}
        hidden={activeTab !== 'digest'}
      >
        {activeTab === 'digest' && (
          <DailyDigestPreview user={user} onOpenAuth={() => setAuthModalOpen(true)} />
        )}
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />

      {/* Persistent Bottom Feature Banner */}
      <footer className="dashboard-footer-banner" role="contentinfo">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Automated Digest Engine:</strong> Active. Configured price briefings dispatch via Email &amp; Discord Webhook at 08:00 UTC.
          </span>
        </div>
        <div className="text-gray-500 font-mono text-xs">
          RigScouter-AI • Continuous Market Intelligence Pipeline (RLS Protected)
        </div>
      </footer>
    </main>
  );
}
