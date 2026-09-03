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
  const [selectedRetailer, setSelectedRetailer] = useState<string>('Micro Center');
  const [digestChannel, setDigestChannel] = useState<'discord' | 'email'>('discord');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Hardware Ticker Deals Data
  const tickerDeals = [
    { name: 'ASUS Dual RTX 4070 Super 12GB', price: '$549.99', save: '$50', retailer: 'Micro Center', score: 94 },
    { name: 'AMD Ryzen 7 7800X3D Gaming CPU', price: '$349.99', save: '$99', retailer: 'Amazon', score: 96 },
    { name: 'Corsair Vengeance RGB 32GB DDR5-6000', price: '$102.99', save: '$17', retailer: 'Newegg', score: 89 },
    { name: 'Samsung 990 Pro 2TB NVMe SSD', price: '$149.99', save: '$40', retailer: 'B&H Photo', score: 93 },
    { name: 'MSI MAG B650 Tomahawk WiFi AM5', price: '$199.99', save: '$20', retailer: 'Best Buy', score: 88 },
    { name: 'Sapphire Pulse RX 7900 XTX 24GB', price: '$889.99', save: '$110', retailer: 'Micro Center', score: 95 },
  ];

  // Top Hardware Deals Data
  const topDeals = [
    { name: 'NVIDIA GeForce RTX 4070 Super 12GB', category: 'GPU', price: 549.99, msrp: 599.99, retailer: 'Micro Center', score: 94, cut: '-8%' },
    { name: 'AMD Radeon RX 7900 XTX 24GB', category: 'GPU', price: 889.99, msrp: 999.99, retailer: 'Newegg', score: 95, cut: '-11%' },
    { name: 'AMD Ryzen 7 7800X3D 8-Core AM5', category: 'CPU', price: 349.99, msrp: 449.00, retailer: 'Amazon', score: 96, cut: '-22%' },
    { name: 'Intel Core i7-14700K 20-Core', category: 'CPU', price: 359.99, msrp: 419.00, retailer: 'Best Buy', score: 90, cut: '-14%' },
    { name: 'Corsair Vengeance 32GB DDR5-6000', category: 'RAM', price: 102.99, msrp: 119.99, retailer: 'Newegg', score: 89, cut: '-14%' },
    { name: 'Samsung 990 Pro 2TB Gen4 M.2 SSD', category: 'Storage', price: 149.99, msrp: 189.99, retailer: 'B&H Photo', score: 93, cut: '-21%' },
  ];

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
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Real-Time PC Hardware Deal Intelligence</span>
        </div>

        {/* Master Headline */}
        <h1 className="text-4xl sm:text-6xl font-black font-heading tracking-tight text-white leading-tight">
          Scout PC Hardware Deals.{' '}
          <span className="gradient-text-blue">Never Overpay.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          RigScouter continuously crawls Micro Center, Amazon, Newegg, Best Buy, and B&H Photo. We compute deep AI deal scores (0–100) and dispatch automated daily price digests to your Email and Discord.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
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
            <div className="text-xl font-black font-heading text-white">5 Retailers</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Micro Center, Amazon & more</div>
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
                      NVIDIA GeForce RTX 4070 Super 12GB
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                      Score: 94/100 (Epic Deal)
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Live pricing unified across 5 retailers on a single canonical card:
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-gray-400">Lowest Price</div>
                  <div className="text-xl font-black text-cyan-400 font-heading">$549.99 <span className="text-xs text-gray-500 line-through">$599.99 MSRP</span></div>
                </div>
              </div>

              {/* Retailer Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { name: 'Micro Center', price: '$549.99', stock: 'In Stock', isLowest: true },
                  { name: 'Amazon', price: '$589.99', stock: 'In Stock', isLowest: false },
                  { name: 'Newegg', price: '$599.99', stock: 'In Stock', isLowest: false },
                  { name: 'Best Buy', price: '$599.99', stock: 'In Stock', isLowest: false },
                  { name: 'B&H Photo', price: '$619.99', stock: 'Backorder', isLowest: false },
                ].map((ret) => (
                  <button
                    key={ret.name}
                    onClick={() => setSelectedRetailer(ret.name)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedRetailer === ret.name
                        ? 'bg-cyan-500/10 border-cyan-500/40'
                        : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{ret.name}</span>
                      {ret.isLowest && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Lowest
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-cyan-400 font-heading mt-1">{ret.price}</div>
                    <div className="text-[10px] text-gray-400">{ret.stock}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-400">
                <span>Active Retailer: <strong className="text-white">{selectedRetailer}</strong></span>
                <Link
                  href="/dashboard"
                  className="btn-glow px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Any Hardware in Dashboard</span>
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
                    Discord
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
                    **Today's Summary:** 2 of your tracked components dropped in price. Total savings opportunity: **$149.00**.
                  </p>
                  <div className="bg-[#2b2d31] p-2.5 rounded-lg border border-gray-800 space-y-1">
                    <div className="text-emerald-400 font-bold text-xs">🟢 RTX 4070 Super 12GB: $549.99 (Save $50)</div>
                    <div className="text-gray-400 text-[11px]">• 24h Delta: -8.3% • All-Time Low: $549.99 • Micro Center</div>
                  </div>
                  <div className="bg-[#2b2d31] p-2.5 rounded-lg border border-gray-800 space-y-1">
                    <div className="text-emerald-400 font-bold text-xs">🟢 Ryzen 7 7800X3D: $349.99 (Save $99)</div>
                    <div className="text-gray-400 text-[11px]">• 24h Delta: -5.4% • 30d Delta: -12.5% • Amazon</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-gray-800 pb-2 font-bold text-white">
                    <span>📬 Daily Hardware Digest</span>
                    <span className="text-cyan-400">Sent via Email</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
                      <div className="text-gray-400 text-[11px]">Top Daily Drop</div>
                      <div className="text-white font-bold">AMD Ryzen 7 7800X3D</div>
                      <div className="text-emerald-400 font-bold text-sm">$349.99 <span className="text-xs line-through text-gray-500">$449.00</span></div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
                      <div className="text-gray-400 text-[11px]">All-Time Low Record</div>
                      <div className="text-white font-bold">Samsung 990 Pro 2TB</div>
                      <div className="text-purple-400 font-bold text-sm">$149.99 (Historical Best)</div>
                    </div>
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
              Automated cron dispatches morning price drop reports directly to your Email and Discord channel at 08:00 AM UTC.
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
                    <td className="py-3 px-5 font-bold text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-cyan-400 font-mono">
                      ${item.price.toFixed(2)}
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
                        href="/dashboard"
                        className="px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-[11px] transition-all"
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
            Monitored 24/7 Across 5 Destinations
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['Micro Center', 'Amazon', 'Newegg', 'Best Buy', 'B&H Photo'].map((name) => (
            <div key={name} className="glass-card p-4 rounded-xl border border-gray-800 text-center space-y-1">
              <div className="font-bold text-white text-xs">{name}</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Active</span>
              </div>
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
