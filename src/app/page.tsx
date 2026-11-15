'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/db/supabase';
import { AuthModal } from '../components/AuthModal';
import {
  Cpu,
  Bell,
  Sparkles,
  ShieldCheck,
  LogIn,
  LogOut,
  ArrowRight,
  Globe,
  CheckCircle2,
  Lock,
  Mail,
  Flame,
  Search,
  MessageSquare,
  BarChart3,
  Layers,
  HelpCircle,
  Server,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Clean 2-mode demo tab
  const [demoTab, setDemoTab] = useState<'comparison' | 'digest'>('comparison');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('eBay');
  const [digestChannel, setDigestChannel] = useState<'discord' | 'email'>('discord');

  // Hardware Ticker Deals Data (hydrated from live database catalog)
  const [tickerDeals, setTickerDeals] = useState<any[]>([
    { name: 'Ryzen 7 9800X3D 8-Core CPU', price: '$369.99', save: '$110', retailer: 'eBay', score: 98 },
    { name: 'TUF Gaming X870-PLUS WiFi AM5', price: '$149.00', save: '$80', retailer: 'Amazon', score: 99 },
    { name: 'Dual GeForce RTX 3060 V2 12GB', price: '$259.99', save: '$190', retailer: 'eBay', score: 95 },
    { name: 'GIGABYTE B850M GAMING X WIFI6E', price: '$123.50', save: '$36', retailer: 'eBay', score: 94 },
    { name: 'ASUS TUF GAMING B650E-PLUS WIFI', price: '$89.99', save: '$80', retailer: 'eBay', score: 99 },
    { name: 'ROG Strix GeForce GTX 1080 Ti 11G', price: '$120.00', save: '$280', retailer: 'eBay', score: 92 },
    { name: 'Sceptre 22" 144Hz FHD Monitor', price: '$62.97', save: '$27', retailer: 'Amazon', score: 95 },
    { name: 'Asrock B650M Pro RS AM5 Board', price: '$109.94', save: '$35', retailer: 'Amazon', score: 93 },
    { name: 'T-Force Vulcan Z 32GB DDR4 RAM', price: '$220.00', save: '$29', retailer: 'eBay', score: 88 }
  ]);

  // Top Hardware Deals Data (hydrated from live database catalog)
  const [topDeals, setTopDeals] = useState<any[]>([
    { id: '1', name: 'ASUS TUF Gaming X870-PLUS WiFi AM5 ATX Motherboard', category: 'Motherboard', price: 149.00, msrp: 229.99, retailer: 'Amazon', score: 99, cut: '-35%' },
    { id: '2', name: 'AMD Ryzen 7 9800X3D 8-Core Desktop Processor', category: 'CPU', price: 369.99, msrp: 479.99, retailer: 'eBay', score: 98, cut: '-23%' },
    { id: '3', name: 'ASUS Dual GeForce RTX 3060 V2 12GB GDDR6 OC Edition', category: 'GPU', price: 259.99, msrp: 449.99, retailer: 'eBay', score: 95, cut: '-42%' },
    { id: '4', name: 'GIGABYTE B850M GAMING X WIFI6E AM5 DDR5 mATX Board', category: 'Motherboard', price: 123.50, msrp: 159.99, retailer: 'eBay', score: 94, cut: '-23%' },
    { id: '5', name: 'Sceptre 22-Inch 1080p 144Hz Gaming Display Monitor', category: 'Monitor', price: 62.97, msrp: 89.99, retailer: 'Amazon', score: 95, cut: '-30%' },
    { id: '6', name: 'ASUS ROG Strix GeForce GTX 1080 Ti 11GB OC Edition', category: 'GPU', price: 120.00, msrp: 399.00, retailer: 'eBay', score: 92, cut: '-70%' },
  ]);

  // Featured Comparison Data (hydrated from live database catalog)
  const [featuredComparison, setFeaturedComparison] = useState<any>({
    name: 'AMD Ryzen 7 9800X3D 8-Core, 16-Thread Desktop Processor',
    category: 'CPU',
    score: 98,
    dealTag: 'All-Time Low',
    lowestPrice: '$369.99',
    msrp: '$479.00',
    retailers: [
      { name: 'eBay', price: '$369.99', stock: 'In Stock', isLowest: true, active: true },
      { name: 'Amazon', price: '$398.05', stock: 'In Stock', isLowest: false, active: true },
      { name: 'Best Buy', price: '$479.00', stock: 'In Stock', isLowest: false, active: false, status: 'testing' },
      { name: 'Micro Center', price: '$479.99', stock: 'In-Store', isLowest: false, active: false, status: 'soon' },
      { name: 'Newegg', price: '$489.99', stock: 'In Stock', isLowest: false, active: false, status: 'soon' },
    ]
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Hydrate market data directly from Supabase database via API route
    fetch('/api/market-preview')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.topDeals && data.topDeals.length > 0) {
            setTopDeals(data.topDeals);
          }
          if (data.tickerDeals && data.tickerDeals.length > 0) {
            setTickerDeals(data.tickerDeals);
          }
          if (data.featuredComparison) {
            setFeaturedComparison(data.featuredComparison);
            const lowest = data.featuredComparison.retailers?.find((r: any) => r.isLowest);
            if (lowest) setSelectedRetailer(lowest.name);
          }
        }
      })
      .catch(err => console.warn('Market preview fetch fallback:', err));

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Ambient Lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* ── Semantic Site Header ─────────────────────────────────────────── */}
      <header role="banner" className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f19]/80 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="RigScouter AI Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-black font-heading tracking-tight text-white">
              RigScouter<span className="text-cyan-400">-AI</span>
            </span>
          </Link>

          {/* Clean Nav Links */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/deal-scoring" className="hover:text-white transition-colors">Deal Scoring</Link>
            <Link href="/methodology" className="hover:text-white transition-colors">Methodology</Link>
            <a href="#pipeline" className="hover:text-white transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[9px] text-gray-950">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <span className="text-gray-300 font-medium max-w-[110px] truncate">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign out of account"
                  className="ml-1 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                aria-label="Sign in to your account"
                className="hidden sm:inline-flex text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}

            <Link
              href="/dashboard"
              aria-label="Launch RigScouter Live Application"
              className="btn-glow px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

        </div>
      </header>

      {/* ── Main Landmark ───────────────────────────────────────────────── */}
      <main id="main-content" role="main">

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="relative pt-16 pb-16 md:pt-24 md:pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Overhead Ambient Glow */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[340px] sm:w-[580px] h-[220px] bg-gradient-to-b from-cyan-400/20 via-blue-500/10 to-transparent blur-[80px] rounded-full pointer-events-none" />

        {/* Pill Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
          <span>Autonomous PC Hardware Market Intelligence</span>
        </div>

        {/* Master Headline */}
        <h1 id="hero-heading" className="relative z-10 text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-white leading-tight">
          Scout PC Hardware Deals.
          <span className="block mt-2 sm:mt-3 gradient-text-blue">
            Never Overpay.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="relative z-10 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          RigScouter continuously crawls Amazon and eBay in real-time, with Best Buy in active testing and Micro Center, Newegg, and B&H Photo coming soon. We compute deep AI deal scores (0–100) and dispatch automated daily price digests to your Email and Discord webhook.
        </p>

        {/* Action CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto btn-glow px-7 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span>Launch Watchlist Tracker</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>

          <a
            href="#demo"
            className="w-full sm:w-auto btn-glass px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>View Live Demo</span>
          </a>
        </div>

        {/* Semantic Metrics Description List */}
        <dl className="stats-dl" aria-label="System Performance Metrics">
          <div className="stats-item">
            <dt className="stats-dt">Multi-Retailer</dt>
            <dd className="stats-dd">Amazon, eBay (Live) + More</dd>
          </div>
          <div className="stats-item">
            <dt className="stats-dt text-cyan-400">&lt; 20ms</dt>
            <dd className="stats-dd">Instant Supabase RLS load</dd>
          </div>
          <div className="stats-item">
            <dt className="stats-dt text-emerald-400">0–100</dt>
            <dd className="stats-dd">AI Deal Score algorithm</dd>
          </div>
          <div className="stats-item">
            <dt className="stats-dt text-purple-400">08:00 UTC</dt>
            <dd className="stats-dd">Automated Daily Digest</dd>
          </div>
        </dl>

      </section>

      {/* ── Live Ticker Strip (Seamless Double-Track Infinite Marquee) ─── */}
      <section aria-label="Live Market Price Drops" className="border-y border-gray-800/80 bg-gray-950/70 py-2.5 overflow-hidden">
        <div className="flex items-center">
          <div className="shrink-0 px-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 border-r border-gray-800 z-20 bg-gray-950 py-1 shadow-[4px_0_12px_rgba(0,0,0,0.45)]">
            <Flame className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
            <span className="whitespace-nowrap">Live Price Drops</span>
          </div>
          
          <div className="relative flex overflow-hidden w-full items-center">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-950 to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-gray-950 to-transparent z-10" />

            {/* Track 1 */}
            <div className="flex shrink-0 animate-marquee gap-3 items-center pl-3">
              {(tickerDeals.length >= 8 ? tickerDeals : [...tickerDeals, ...tickerDeals, ...tickerDeals])
                .filter(deal => deal && deal.name && deal.price)
                .map((deal, idx) => (
                  <div
                    key={`track1-${idx}-${deal.name.slice(0, 8)}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-900 border border-gray-800/80 text-xs font-medium shrink-0 whitespace-nowrap hover:border-cyan-500/40 transition-colors"
                  >
                    <span className="text-gray-200 font-semibold">{deal.name}</span>
                    <span className="text-cyan-400 font-bold">{deal.price}</span>
                    {deal.save && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Save {deal.save}
                      </span>
                    )}
                    <span className="text-gray-400 text-[11px]">• {deal.retailer || 'Retailer'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                      {deal.score || 85}/100
                    </span>
                  </div>
                ))}
            </div>

            {/* Track 2 */}
            <div className="flex shrink-0 animate-marquee gap-3 items-center pl-3" aria-hidden="true">
              {(tickerDeals.length >= 8 ? tickerDeals : [...tickerDeals, ...tickerDeals, ...tickerDeals])
                .filter(deal => deal && deal.name && deal.price)
                .map((deal, idx) => (
                  <div
                    key={`track2-${idx}-${deal.name.slice(0, 8)}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-900 border border-gray-800/80 text-xs font-medium shrink-0 whitespace-nowrap hover:border-cyan-500/40 transition-colors"
                  >
                    <span className="text-gray-200 font-semibold">{deal.name}</span>
                    <span className="text-cyan-400 font-bold">{deal.price}</span>
                    {deal.save && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Save {deal.save}
                      </span>
                    )}
                    <span className="text-gray-400 text-[11px]">• {deal.retailer || 'Retailer'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                      {deal.score || 85}/100
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Sandbox Preview ─────────────────────────────────── */}
      <section id="demo" aria-labelledby="demo-heading" className="section-container space-y-6">
        <header className="section-header">
          <span className="section-kicker">Interactive Preview</span>
          <h2 id="demo-heading" className="section-title">
            See How RigScouter Works
          </h2>
          <p className="section-lead">
            Explore live price unification across stores and view preview snapshots of automated morning digests.
          </p>
        </header>

        {/* Accessible Tab Navigation */}
        <div className="flex justify-center">
          <div role="tablist" aria-label="Interactive Demo Modes" className="inline-flex p-1 bg-gray-900 rounded-xl border border-gray-800">
            <button
              role="tab"
              id="tab-comparison"
              aria-selected={demoTab === 'comparison'}
              aria-controls="panel-comparison"
              onClick={() => setDemoTab('comparison')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                demoTab === 'comparison'
                  ? 'bg-gray-800 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Multi-Retailer Price Comparison
            </button>
            <button
              role="tab"
              id="tab-digest"
              aria-selected={demoTab === 'digest'}
              aria-controls="panel-digest"
              onClick={() => setDemoTab('digest')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                demoTab === 'digest'
                  ? 'bg-gray-800 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Automated Daily Digest
            </button>
          </div>
        </div>

        {/* Tab Panels */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-gray-800">
          {demoTab === 'comparison' ? (
            <div role="tabpanel" id="panel-comparison" aria-labelledby="tab-comparison" className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-heading">
                      {featuredComparison.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                      Score: {featuredComparison.score}/100 ({featuredComparison.dealTag})
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Live pricing unified across 5 retailers on a single canonical card:
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-gray-400">Lowest Price</div>
                  <div className="text-xl font-black text-cyan-400 font-heading">
                    {featuredComparison.lowestPrice}{' '}
                    <span className="text-xs text-gray-500 line-through">{featuredComparison.msrp} MSRP</span>
                  </div>
                </div>
              </div>

              {/* Retailer Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {featuredComparison.retailers.map((ret: any) => (
                  <button
                    key={ret.name}
                    onClick={() => setSelectedRetailer(ret.name)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedRetailer === ret.name
                        ? 'bg-cyan-500/10 border-cyan-500/40'
                        : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-white truncate">{ret.name}</span>
                      {ret.isLowest ? (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                          Lowest
                        </span>
                      ) : ret.name === 'Best Buy' || ret.status === 'testing' ? (
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold shrink-0 flex items-center gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></span>
                          Testing
                        </span>
                      ) : !ret.active || ret.status === 'soon' ? (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold shrink-0">
                          Soon
                        </span>
                      ) : null}
                    </div>
                    <div className="text-base font-bold text-cyan-400 font-heading mt-1">{ret.price}</div>
                    <div className="text-[10px] text-gray-400">{ret.stock}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-400">
                <span>Active Retailer: <strong className="text-white">{selectedRetailer}</strong></span>
                <Link
                  href={`/dashboard?search=${encodeURIComponent(featuredComparison.name)}`}
                  className="btn-glow px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Search in Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            <div role="tabpanel" id="panel-digest" aria-labelledby="tab-digest" className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Automated Morning Briefing Preview (08:00 UTC)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Dispatched daily to your active notification channels.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDigestChannel('discord')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      digestChannel === 'discord' ? 'bg-[#5865F2] text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Discord
                  </button>
                  <button
                    onClick={() => setDigestChannel('email')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      digestChannel === 'email' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800/80 font-mono text-xs text-gray-300 space-y-2">
                <div className="text-cyan-400 font-bold">🔔 RigScouter Morning Intelligence Briefing</div>
                <div className="text-gray-400 text-[11px]">Today's Top Hardware Movers across 5 Monitored Retailers:</div>
                <ul role="list" className="space-y-1.5 pt-1 text-[11px]">
                  <li className="text-emerald-400">
                    • Ryzen 7 9800X3D: $369.99 (ATL Hit on eBay) — Save $110 (Score: 98/100)
                  </li>
                  <li className="text-emerald-400">
                    • ASUS TUF X870-PLUS WiFi: $149.00 on Amazon — Save $80 (Score: 99/100)
                  </li>
                  <li className="text-cyan-400">
                    • Dual RTX 3060 12GB: $259.99 on eBay — 42% Under Historical High (Score: 95/100)
                  </li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <Link
                  href="/dashboard"
                  className="btn-glow px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Configure Notifications</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 3 Core Pillars (Semantic Architecture List) ─────────────────── */}
      <section id="features" aria-labelledby="features-heading" className="section-container space-y-8">
        <header className="section-header">
          <span className="section-kicker">Core Architecture</span>
          <h2 id="features-heading" className="section-title">
            Built for Serious PC Enthusiasts
          </h2>
          <p className="section-lead">
            Adversarial price validation designed to detect artificial discounts and protect consumers from inflated hardware pricing.
          </p>
        </header>

        <ul role="list" className="feature-grid">
          
          {/* Card 1 */}
          <li role="listitem">
            <article className="feature-card h-full">
              <div className="feature-icon-box bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Globe className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">Multi-Retailer Scraping</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Scrapes Micro Center, Amazon, Newegg, Best Buy, and B&H Photo in real-time, normalizing partner variations into clean canonical models.
              </p>
            </article>
          </li>

          {/* Card 2 */}
          <li role="listitem">
            <article className="feature-card h-full">
              <div className="feature-icon-box bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <BarChart3 className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">AI Deal Scoring (0–100)</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Cuts through artificial retailer discounts by evaluating MSRP variance, 90-day lowest prices, and cross-retailer competition.
              </p>
            </article>
          </li>

          {/* Card 3 */}
          <li role="listitem">
            <article className="feature-card h-full">
              <div className="feature-icon-box bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">Automated Daily Digest</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Automated cron dispatches morning price drop reports directly to your Email and Discord webhook at 08:00 AM UTC.
              </p>
            </article>
          </li>

        </ul>
      </section>

      {/* ── 4-Tier Scraper Pipeline Architecture Section ────────────────── */}
      <section id="pipeline" aria-labelledby="pipeline-heading" className="section-container space-y-8">
        <header className="section-header">
          <span className="section-kicker">High Availability Scraping</span>
          <h2 id="pipeline-heading" className="section-title">
            The 4-Tier Fallback Pipeline
          </h2>
          <p className="section-lead">
            How RigScouter maintains 100% data continuity without getting blocked or delivering stale pricing data.
          </p>
        </header>

        <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <li role="listitem">
            <article className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">Tier 1</span>
                <h3 className="text-sm font-bold text-white font-heading">Direct OAuth 2.0 REST API</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Queries certified high-throughput endpoints (such as the eBay Buy & Browse API) with sub-second tokenized responses and official live inventory tags.
              </p>
            </article>
          </li>

          <li role="listitem">
            <article className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">Tier 2</span>
                <h3 className="text-sm font-bold text-white font-heading">TLS Fingerprint Impersonation</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Uses asynchronous HTTP clients simulating modern Chrome 124 JA3/TLS handshakes to navigate anti-bot verification challenges cleanly.
              </p>
            </article>
          </li>

          <li role="listitem">
            <article className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">Tier 3</span>
                <h3 className="text-sm font-bold text-white font-heading">All Offers Display (AOD) Extraction</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Inspects multi-seller side-drawers on suppressed Buy Box pages, filtering strictly for Brand New condition to avoid false Used/Renewed price reporting.
              </p>
            </article>
          </li>

          <li role="listitem">
            <article className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">Tier 4</span>
                <h3 className="text-sm font-bold text-white font-heading">Real-Time Search AI Fallback</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                If retailers throttle direct access, our engine queries real-time web cache indexers, extracting prices with regex filters for shipping, gift cards, and bundles.
              </p>
            </article>
          </li>
        </ul>
      </section>

      {/* ── Top Deals Benchmark Table ───────────────────────────────────── */}
      <section id="deals" aria-labelledby="deals-heading" className="section-container space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="section-kicker">Market Intelligence</span>
            <h2 id="deals-heading" className="section-title mt-0.5">
              Top Hardware Deals
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Full Watchlist</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="glass-card overflow-hidden border border-gray-800 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">Top Live PC Hardware Deals Scored by RigScouter AI</caption>
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 font-semibold">
                  <th scope="col" className="py-3.5 px-5">Hardware Component</th>
                  <th scope="col" className="py-3.5 px-3">Category</th>
                  <th scope="col" className="py-3.5 px-3">Lowest Price</th>
                  <th scope="col" className="py-3.5 px-3">Retailer</th>
                  <th scope="col" className="py-3.5 px-3">Deal Score</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-medium">
                {topDeals.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 px-5 font-bold text-white max-w-[260px] sm:max-w-xs">
                      <div className="truncate" title={item.name}>{item.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-cyan-400 font-mono">
                      ${Number(item.price).toFixed(2)}
                      {item.cut && item.cut !== '-' && (
                        <span className="ml-1.5 text-[10px] text-emerald-400 font-semibold">{item.cut}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-300">
                      {item.retailer}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-orange-500/20 text-orange-300">
                        {item.score}/100
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        href={`/dashboard?search=${encodeURIComponent(item.name)}`}
                        className="px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-[11px] transition-all inline-block"
                      >
                        Track
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Supported Retailers Network ─────────────────────────────────── */}
      <section id="retailers" aria-labelledby="retailers-heading" className="section-container space-y-6">
        <header className="section-header">
          <span className="section-kicker">Supported Retailers</span>
          <h2 id="retailers-heading" className="section-title">
            Multi-Retailer Pricing Engine
          </h2>
          <p className="section-lead">
            Real-time automated pricing across active retailers, with additional major hardware destinations rolling out soon.
          </p>
        </header>

        <ul role="list" className="retailer-grid">
          {[
            { name: 'Amazon', active: true },
            { name: 'eBay', active: true },
            { name: 'Best Buy', status: 'testing' },
            { name: 'Micro Center', active: false },
            { name: 'Newegg', active: false },
            { name: 'B&H Photo', active: false },
          ].map((ret) => (
            <li
              key={ret.name}
              className={`retailer-card ${
                ret.active
                  ? 'border-cyan-500/30 bg-cyan-950/20 shadow-sm shadow-cyan-500/10'
                  : ret.status === 'testing'
                  ? 'border-cyan-500/40 bg-cyan-950/30 shadow-sm shadow-cyan-500/15'
                  : 'border-gray-800/80 bg-gray-950/40 opacity-75'
              }`}
            >
              <div className="font-bold text-white text-xs">{ret.name}</div>
              {ret.active ? (
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                  <span>Live</span>
                </div>
              ) : ret.status === 'testing' ? (
                <div className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
                  <span>Testing</span>
                </div>
              ) : (
                <div className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span>Coming Soon</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Comprehensive Technical FAQ Section ─────────────────────────── */}
      <section id="faq" aria-labelledby="faq-heading" className="section-container space-y-8">
        <header className="section-header">
          <span className="section-kicker">Knowledge Base</span>
          <h2 id="faq-heading" className="section-title">
            Frequently Asked Questions
          </h2>
          <p className="section-lead">
            Technical answers to how RigScouter handles real-time scraping, out-of-stock listings, and algorithmic deal evaluations.
          </p>
        </header>

        <ul role="list" className="faq-list">
          <li role="listitem">
            <details className="faq-item" open>
              <summary className="faq-summary">
                <span>How does the 0–100 AI Deal Score distinguish real deals from fake sales?</span>
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              </summary>
              <div className="faq-content">
                Many online sellers mark prices up right before advertising a "35% OFF" sale. RigScouter ignores marketing banners and computes a multi-factor score: 45% based on variance against the verified 90-day all-time low, 35% against manufacturer MSRP, and 20% on current multi-retailer competitive spread. Only hardware genuinely selling near historic minimums earns a score above 90.
              </div>
            </details>
          </li>

          <li role="listitem">
            <details className="faq-item">
              <summary className="faq-summary">
                <span>What happens when an item in my watchlist sells out or gets restocked?</span>
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              </summary>
              <div className="faq-content">
                Our self-healing crawler employs a 2-cycle grace period to ensure brief network throttles are not mistaken for sold-out inventory. If an item is confirmed out of stock, its deal score is zeroed to prevent bad alerts. When the seller restocks or another monitored retailer (e.g., Amazon) has the item in stock, the engine automatically hot-swaps to the active retailer and updates pricing.
              </div>
            </details>
          </li>

          <li role="listitem">
            <details className="faq-item">
              <summary className="faq-summary">
                <span>How often are hardware prices refreshed?</span>
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              </summary>
              <div className="faq-content">
                The global catalog runs automated cycles daily at 00:00 UTC and 08:00 UTC, while individual user watchlists trigger background refreshes whenever items are inspected. Changes trigger rolling time-series delta recalculations across 24-hour, 7-day, and 30-day intervals.
              </div>
            </details>
          </li>

          <li role="listitem">
            <details className="faq-item">
              <summary className="faq-summary">
                <span>Why are Used or Renewed items separated from Brand New pricing?</span>
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              </summary>
              <div className="faq-content">
                Amazon All Offers Display and third-party marketplaces often mix refurbished, open-box, and brand-new hardware together. RigScouter parses condition headers strictly—prioritizing Brand New Buy Box pricing while clearly badging open-box offers so users are never misled by lower used prices.
              </div>
            </details>
          </li>

          <li role="listitem">
            <details className="faq-item">
              <summary className="faq-summary">
                <span>Can I receive notifications on Discord or Email?</span>
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              </summary>
              <div className="faq-content">
                Yes. Through the user preferences dashboard, you can supply a Discord Webhook URL or verify your email address to receive custom threshold drop alerts and automated morning digests.
              </div>
            </details>
          </li>
        </ul>
      </section>

      {/* ── Bottom CTA Banner ──────────────────────────────────────────── */}
      <section aria-labelledby="cta-heading" className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-10 rounded-2xl border border-cyan-500/20 text-center space-y-4">
          <h2 id="cta-heading" className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
            Ready to Track PC Deals?
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
            Launch the dashboard to search hardware, set target price alert thresholds, and receive automated daily digests.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="btn-glow px-6 py-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span>Launch Live Dashboard</span>
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* ── Semantic Site Footer ────────────────────────────────────────── */}
      <footer role="contentinfo" className="border-t border-gray-800/80 bg-gray-950/80 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2 text-gray-300 font-bold">
              <Cpu className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span>RigScouter-AI</span>
            </div>
            <div>
              © 2026 RigScouter-AI • Autonomous PC Hardware Intelligence
            </div>
            <nav aria-label="Footer Navigation" className="flex items-center gap-5">
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link href="/features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/deal-scoring" className="hover:text-white transition-colors">Deal Scoring</Link>
              <Link href="/methodology" className="hover:text-white transition-colors">Methodology</Link>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>
          </div>
          <p className="text-[11px] text-gray-600 text-center sm:text-left">
            RigScouter AI is an independent automated price intelligence engine tracking computer hardware components across major global retail platforms. All product trademarks, model names, and manufacturer logos are the property of their respective owners.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </div>
  );
}
