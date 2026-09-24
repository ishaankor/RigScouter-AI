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
  ArrowUpRight
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Clean 2-mode demo tab
  const [demoTab, setDemoTab] = useState<'comparison' | 'digest'>('comparison');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('eBay');
  const [digestChannel, setDigestChannel] = useState<'discord' | 'email'>('discord');

  // Hardware Ticker Deals Data (dynamically hydrated from DB)
  const [tickerDeals, setTickerDeals] = useState<any[]>([
    { name: 'AMD Ryzen 7 5800XT 8-Core', price: '$220.00', save: '$29', retailer: 'Amazon', score: 95 },
    { name: 'ASUS TUF RTX 3060 Ti V2 OC', price: '$314.99', save: '$45', retailer: 'Amazon', score: 99 },
    { name: 'King 95 PRO Dual-Chamber Mid-Tower', price: '$100.00', save: '$60', retailer: 'eBay', score: 99 },
    { name: 'NV3 1TB M.2 2280 NVMe SSD', price: '$74.99', save: '$87', retailer: 'eBay', score: 99 },
    { name: 'B650M D3HP AX AM5 Motherboard', price: '$70.00', save: '$50', retailer: 'eBay', score: 99 },
    { name: 'GeForce RTX 4080 Super 16G', price: '$1200.00', save: '$295', retailer: 'eBay', score: 90 },
  ]);

  // Top Hardware Deals Data (dynamically hydrated from DB)
  const [topDeals, setTopDeals] = useState<any[]>([
    { id: '1', name: 'King 95 PRO Dual-Chamber ATX Mid-Tower Case', category: 'Case', price: 100.00, msrp: 159.88, retailer: 'eBay', score: 99, cut: '-37%' },
    { id: '2', name: 'B650M D3HP AX AMD AM5 mATX Motherboard', category: 'Motherboard', price: 70.00, msrp: 119.99, retailer: 'eBay', score: 99, cut: '-42%' },
    { id: '3', name: 'NV3 1TB M.2 2280 NVMe SSD PCIe 4.0', category: 'Storage', price: 74.99, msrp: 162.00, retailer: 'eBay', score: 99, cut: '-54%' },
    { id: '4', name: 'Ryzen 5 8500G 6-Core Desktop Processor', category: 'CPU', price: 66.50, msrp: 146.99, retailer: 'eBay', score: 99, cut: '-55%' },
    { id: '5', name: 'ASUS TUF Gaming GeForce RTX 3060 Ti V2', category: 'GPU', price: 314.99, msrp: 359.99, retailer: 'Amazon', score: 99, cut: '-13%' },
    { id: '6', name: 'AMD Ryzen 7 5800XT 8-Core Processor', category: 'CPU', price: 220.00, msrp: 249.00, retailer: 'Amazon', score: 95, cut: '-12%' },
  ]);

  // Featured Comparison Data (dynamically hydrated from DB)
  const [featuredComparison, setFeaturedComparison] = useState<any>({
    name: 'AMD Ryzen 7 5800XT 8-Core Desktop Processor',
    category: 'CPU',
    score: 95,
    dealTag: 'Epic Deal',
    lowestPrice: '$155.00',
    msrp: '$249.00',
    retailers: [
      { name: 'eBay', price: '$155.00', stock: 'In Stock', isLowest: true, active: true },
      { name: 'Amazon', price: '$220.00', stock: 'In Stock', isLowest: false, active: true },
      { name: 'Best Buy', price: '$239.00', stock: 'In Stock', isLowest: false, active: false, status: 'testing' },
      { name: 'Micro Center', price: '$219.99', stock: 'In-Store', isLowest: false, active: false, status: 'soon' },
      { name: 'Newegg', price: '$229.99', stock: 'In Stock', isLowest: false, active: false, status: 'soon' },
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

      {/* ── Sleek Minimal Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f19]/80 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black font-heading tracking-tight text-white">
              RigScouter<span className="text-cyan-400">-AI</span>
            </span>
          </Link>

          {/* Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Live Preview</a>
            <a href="#deals" className="hover:text-white transition-colors">Top Deals</a>
            <a href="#retailers" className="hover:text-white transition-colors">Retailers</a>
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
                  className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:inline-flex text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}

            <Link
              href="/dashboard"
              className="btn-glow px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 overflow-visible">
        
        {/* Overhead Spotlight Beam casting down onto the Title */}
        <div className="absolute -top-12 sm:-top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[440px] pointer-events-none overflow-visible flex items-center justify-center z-0">
          {/* Ambient soft glow aura */}
          <div className="absolute top-2 sm:top-6 w-[340px] sm:w-[580px] h-[240px] bg-gradient-to-b from-cyan-400/25 via-blue-500/10 to-transparent blur-[85px] rounded-full" />
          
          {/* Volumetric spotlight cone */}
          <svg
            className="w-[520px] sm:w-[780px] md:w-[920px] h-[380px] sm:h-[450px] opacity-80"
            viewBox="0 0 900 450"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g filter="url(#hero-spotlight-filter)">
              {/* Expanding conical light beam */}
              <path
                d="M450 15 L100 445 L800 445 Z"
                fill="url(#hero-spotlight-gradient)"
                fillOpacity="0.45"
              />
              {/* Overhead light emitter source */}
              <ellipse cx="450" cy="22" rx="150" ry="24" fill="#00f2fe" fillOpacity="0.8" />
              <ellipse cx="450" cy="20" rx="75" ry="12" fill="#ffffff" fillOpacity="0.95" />
            </g>
            <defs>
              <filter
                id="hero-spotlight-filter"
                x="-80"
                y="-50"
                width="1060"
                height="550"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="40" result="blur" />
              </filter>
              <linearGradient
                id="hero-spotlight-gradient"
                x1="450"
                y1="15"
                x2="450"
                y2="445"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00f2fe" stopOpacity="0.95" />
                <stop offset="0.35" stopColor="#38bdf8" stopOpacity="0.55" />
                <stop offset="0.7" stopColor="#4facfe" stopOpacity="0.2" />
                <stop offset="1" stopColor="#7928ca" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Pill Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Real-Time PC Hardware Deal Intelligence</span>
        </div>

        {/* Master Headline */}
        <h1 className="relative z-10 text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-white leading-tight">
          Scout PC Hardware Deals.
          <span className="block mt-2 sm:mt-3 gradient-text-blue">
            Never Overpay.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="relative z-10 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          RigScouter continuously crawls Amazon and eBay in real-time, with Best Buy in testing and Micro Center, Newegg, and B&H Photo coming soon. We compute deep AI deal scores (0–100) and dispatch automated daily price digests to your Email and Discord webhook.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto btn-glow px-7 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
          >
            <Bell className="w-4 h-4" />
            <span>Launch Watchlist Tracker</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#demo"
            className="w-full sm:w-auto btn-glass px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>View Live Demo</span>
          </a>
        </div>

        {/* Clean Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 max-w-3xl mx-auto text-center">
          <div className="glass-card p-3.5 rounded-xl border border-gray-800">
            <div className="text-xl font-black font-heading text-white">Multi-Retailer</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Amazon, eBay (Live) + More</div>
          </div>
          <div className="glass-card p-3.5 rounded-xl border border-gray-800">
            <div className="text-xl font-black font-heading text-cyan-400">&lt; 20ms</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Instant Supabase RLS load</div>
          </div>
          <div className="glass-card p-3.5 rounded-xl border border-gray-800">
            <div className="text-xl font-black font-heading text-emerald-400">0–100</div>
            <div className="text-[11px] text-gray-400 mt-0.5">AI Deal Score algorithm</div>
          </div>
          <div className="glass-card p-3.5 rounded-xl border border-gray-800">
            <div className="text-xl font-black font-heading text-purple-400">08:00 UTC</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Automated Daily Digest</div>
          </div>
        </div>

      </section>

      {/* ── Live Ticker Strip ──────────────────────────────────────────── */}
      <div className="border-y border-gray-800/80 bg-gray-950/50 py-2.5 overflow-hidden">
        <div className="flex items-center">
          <div className="shrink-0 px-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 border-r border-gray-800 z-10 bg-gray-950 py-0.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Live Price Drops</span>
          </div>
          
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="animate-ticker flex gap-3 pl-3">
              {[...tickerDeals, ...tickerDeals].map((deal, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-900 border border-gray-800/80 text-xs font-medium shrink-0"
                >
                  <span className="text-gray-300 font-semibold">{deal.name}</span>
                  <span className="text-cyan-400 font-bold">{deal.price}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Save {deal.save}
                  </span>
                  <span className="text-gray-500 text-[11px]">• {deal.retailer}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                    {deal.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Clean Interactive Sandbox Preview ──────────────────────────── */}
      <section id="demo" className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Interactive Preview</span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
            See How RigScouter Works
          </h2>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-gray-900 rounded-xl border border-gray-800">
            <button
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

        {/* Interactive Card */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-gray-800">
          {demoTab === 'comparison' ? (
            <div className="space-y-5">
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
                  <Search className="w-3.5 h-3.5" />
                  <span>Search in Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Automated Morning Briefing Preview (08:00 UTC)
                  </h3>
                  <p className="text-xs text-gray-400">
                    24h, 7-day, 30-day, and All-Time Low (ATL) price delta analysis.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDigestChannel('discord')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      digestChannel === 'discord' ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400'
                    }`}
                  >
                    Discord Webhook
                  </button>
                  <button
                    onClick={() => setDigestChannel('email')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      digestChannel === 'email' ? 'bg-cyan-600 text-white' : 'bg-gray-900 text-gray-400'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              {digestChannel === 'discord' ? (
                <div className="bg-[#1e1f22] p-4 rounded-xl border border-gray-800 font-mono text-xs text-gray-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <span>🤖 RigScouter Daily Digest</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300">BOT</span>
                  </div>
                  <p className="text-gray-300 text-xs">
                    **Today&apos;s Summary:** Active price drops scouted across tracked inventory. Total savings opportunity: **${Math.max(45, Math.round(((topDeals[0]?.msrp || 0) - (topDeals[0]?.price || 0)) + ((topDeals[1]?.msrp || 0) - (topDeals[1]?.price || 0))))}.00**.
                  </p>
                  {topDeals.slice(0, 2).map((deal, i) => (
                    <div key={i} className="bg-[#2b2d31] p-2.5 rounded-lg border border-gray-800 space-y-1">
                      <div className="text-emerald-400 font-bold text-xs">🟢 {deal.name}: ${Number(deal.price).toFixed(2)} {deal.cut !== '-' ? `(Save ${deal.cut})` : ''}</div>
                      <div className="text-gray-400 text-[11px]">• Retailer: {deal.retailer} • Deal Score: {deal.score}/100 • Category: {deal.category}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-gray-800 pb-2 font-bold text-white">
                    <span>📬 Daily Hardware Digest</span>
                    <span className="text-cyan-400">Sent via Email</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {topDeals.slice(0, 2).map((deal, i) => (
                      <div key={i} className="p-3 rounded-lg bg-gray-950 border border-gray-800">
                        <div className="text-gray-400 text-[11px]">{i === 0 ? 'Top Daily Deal' : 'High Value Pick'}</div>
                        <div className="text-white font-bold truncate">{deal.name}</div>
                        <div className="text-emerald-400 font-bold text-sm">
                          ${Number(deal.price).toFixed(2)}{' '}
                          {deal.msrp > deal.price && (
                            <span className="text-xs line-through text-gray-500">${Number(deal.msrp).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-right">
                <Link
                  href="/dashboard"
                  className="btn-glow inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Configure Digest in Dashboard</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 3 Core Pillars (Clean Grid) ─────────────────────────────────── */}
      <section id="features" className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Core Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
            Built for Serious PC Enthusiasts
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Retailer Scraping</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Scrapes Micro Center, Amazon, Newegg, Best Buy, and B&H Photo in real-time, normalizing partner variations into clean canonical models.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">AI Deal Scoring (0–100)</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Cuts through artificial retailer discounts by evaluating MSRP variance, 90-day lowest prices, and cross-retailer competition.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Automated Daily Digest</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Automated cron dispatches morning price drop reports directly to your Email and Discord webhook at 08:00 AM UTC.
            </p>
          </div>

        </div>
      </section>

      {/* ── Top Deals Benchmark Table ───────────────────────────────────── */}
      <section id="deals" className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Market Intelligence</span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight mt-0.5">
              Top Hardware Deals
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Full Watchlist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card overflow-hidden border border-gray-800 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 font-semibold">
                  <th className="py-3.5 px-5">Hardware Component</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Lowest Price</th>
                  <th className="py-3.5 px-3">Retailer</th>
                  <th className="py-3.5 px-3">Deal Score</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
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
      <section id="retailers" className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Supported Retailers</span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
            Multi-Retailer Pricing Engine
          </h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Real-time automated pricing across active retailers, with additional major hardware destinations rolling out soon.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: 'Amazon', active: true },
            { name: 'eBay', active: true },
            { name: 'Best Buy', status: 'testing' },
            { name: 'Micro Center', active: false },
            { name: 'Newegg', active: false },
            { name: 'B&H Photo', active: false },
          ].map((ret) => (
            <div
              key={ret.name}
              className={`glass-card p-4 rounded-xl border text-center space-y-2 transition-all ${
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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live</span>
                </div>
              ) : ret.status === 'testing' ? (
                <div className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Testing</span>
                </div>
              ) : (
                <div className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span>Coming Soon</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Clean Bottom CTA Banner ────────────────────────────────────── */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-10 rounded-2xl border border-cyan-500/20 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
            Ready to Track PC Deals?
          </h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Launch the dashboard to search hardware, set target price alert thresholds, and receive automated daily digests.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="btn-glow px-6 py-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Bell className="w-4 h-4" />
              <span>Launch Live Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Minimal Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800/80 bg-gray-950/80 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2 text-gray-300 font-bold">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>RigScouter-AI</span>
          </div>
          <div>
            © 2026 RigScouter-AI • Autonomous PC Hardware Intelligence
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#retailers" className="hover:text-white transition-colors">Retailers</a>
          </div>
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
