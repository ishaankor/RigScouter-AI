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
  Zap,
  CheckCircle2,
  Lock,
  Mail,
  Sliders,
  TrendingDown,
  Flame,
  Check,
  ExternalLink,
  ChevronRight,
  Database,
  Search,
  MessageSquare,
  Clock,
  Layers,
  BarChart3,
  Server,
  AlertCircle
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Interactive Sandbox Tab State
  const [demoTab, setDemoTab] = useState<'comparison' | 'alerts' | 'digest'>('comparison');
  const [demoTargetPrice, setDemoTargetPrice] = useState<number>(520);
  const [demoSelectedRetailer, setDemoSelectedRetailer] = useState<string>('Micro Center');
  const [demoDigestChannel, setDemoDigestChannel] = useState<'discord' | 'email'>('discord');

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

  // Hardware Ticker Deals Data
  const tickerDeals = [
    { name: 'ASUS Dual RTX 4070 Super 12GB', price: '$549.99', msrp: '$599.99', save: '$50', retailer: 'Micro Center', score: 94, hot: true },
    { name: 'AMD Ryzen 7 7800X3D Gaming CPU', price: '$349.99', msrp: '$449.00', save: '$99', retailer: 'Amazon', score: 96, hot: true },
    { name: 'Corsair Vengeance RGB 32GB DDR5-6000', price: '$102.99', msrp: '$119.99', save: '$17', retailer: 'Newegg', score: 89, hot: false },
    { name: 'Samsung 990 Pro 2TB PCIe 4.0 NVMe', price: '$149.99', msrp: '$189.99', save: '$40', retailer: 'B&H Photo', score: 93, hot: true },
    { name: 'MSI MAG B650 Tomahawk WiFi AM5', price: '$199.99', msrp: '$219.99', save: '$20', retailer: 'Best Buy', score: 88, hot: false },
    { name: 'Sapphire Pulse RX 7900 XTX 24GB', price: '$889.99', msrp: '$999.99', save: '$110', retailer: 'Micro Center', score: 95, hot: true },
  ];

  // Benchmark Hardware Matrix
  const hardwareMatrix = [
    { name: 'NVIDIA GeForce RTX 4090 24GB', category: 'GPU', lowestPrice: 1749.99, msrp: 1599.99, retailer: 'B&H Photo', dealScore: 78, delta: '+9%', status: 'In Stock' },
    { name: 'NVIDIA GeForce RTX 4080 Super 16GB', category: 'GPU', lowestPrice: 969.99, msrp: 999.99, retailer: 'Micro Center', dealScore: 91, delta: '-3%', status: 'In Stock' },
    { name: 'NVIDIA GeForce RTX 4070 Super 12GB', category: 'GPU', lowestPrice: 549.99, msrp: 599.99, retailer: 'Micro Center', dealScore: 94, delta: '-8%', status: 'In Stock' },
    { name: 'AMD Radeon RX 7900 XTX 24GB', category: 'GPU', lowestPrice: 889.99, msrp: 999.99, retailer: 'Newegg', dealScore: 95, delta: '-11%', status: 'In Stock' },
    { name: 'AMD Ryzen 7 7800X3D (8-Core AM5)', category: 'CPU', lowestPrice: 349.99, msrp: 449.00, retailer: 'Amazon', dealScore: 96, delta: '-22%', status: 'In Stock' },
    { name: 'Intel Core i7-14700K (20-Core)', category: 'CPU', lowestPrice: 359.99, msrp: 419.00, retailer: 'Best Buy', dealScore: 90, delta: '-14%', status: 'In Stock' },
    { name: 'Corsair Vengeance 32GB DDR5-6000 CL30', category: 'RAM', lowestPrice: 102.99, msrp: 119.99, retailer: 'Newegg', dealScore: 89, delta: '-14%', status: 'In Stock' },
    { name: 'Samsung 990 Pro 2TB Gen4 M.2 SSD', category: 'Storage', lowestPrice: 149.99, msrp: 189.99, retailer: 'B&H Photo', dealScore: 93, delta: '-21%', status: 'In Stock' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0b0f19] text-gray-100">
      {/* Radiant Background Ambient Lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none glow-sphere" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none glow-sphere" />
      <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none glow-sphere" />

      {/* ── Sticky Modern Navigation Bar ───────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b0f19]/80 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-heading tracking-tight gradient-text-blue">
                  RigScouter<span className="text-white">-AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                  v0.1.0
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium hidden md:block">
                Autonomous PC Hardware Deal Intelligence
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-gray-400">
            <a href="#scraper" className="hover:text-cyan-400 transition-colors">Multi-Retailer Scraper</a>
            <a href="#scoring" className="hover:text-cyan-400 transition-colors">AI Deal Scoring</a>
            <a href="#watchlist" className="hover:text-cyan-400 transition-colors">Watchlist & Alerts</a>
            <a href="#digest" className="hover:text-cyan-400 transition-colors">Daily Digest</a>
            <a href="#retailers" className="hover:text-cyan-400 transition-colors">Supported Retailers</a>
            <Link href="/features" className="hover:text-white text-gray-300 transition-colors">Architecture</Link>
          </nav>

          {/* User Auth & Launch App Action */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-gray-900/90 border border-gray-800 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[10px] text-gray-950">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <span className="text-gray-300 font-medium max-w-[120px] truncate">{user.email}</span>
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
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sign In</span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="btn-glow px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Top Radiant Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-500/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Autonomous Multi-Retailer Scraping • AI Deal Scoring • Supabase RLS</span>
          </div>

          {/* Magnetic Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-white leading-[1.08]">
            Scout Hardware Deals.{' '}
            <span className="gradient-text-blue block sm:inline">AI Deal Scoring.</span>{' '}
            Never Overpay.
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            RigScouter-AI continuously scrapes Micro Center, Amazon, Newegg, Best Buy, and B&H Photo in real-time, calculates deep AI deal scores (0–100), tracks historical lows, and delivers automated daily price digests to your Email and Discord.
          </p>

          {/* Hero Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto btn-glow px-8 py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 group"
            >
              <Bell className="w-4 h-4" />
              <span>Launch Watchlist Tracker</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto btn-glass px-8 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Interactive Feature Demo</span>
            </a>
          </div>

          {/* Key Metric Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto text-left">
            <div className="glass-card p-4 rounded-2xl border border-gray-800/80">
              <div className="text-2xl font-black font-heading gradient-text-blue">5 Retailers</div>
              <div className="text-xs text-gray-400 mt-1">Micro Center, Amazon, Newegg, Best Buy, B&H</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-gray-800/80">
              <div className="text-2xl font-black font-heading gradient-text-purple">&lt; 20ms DB</div>
              <div className="text-xs text-gray-400 mt-1">Supabase Row-Level Security isolation</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-gray-800/80">
              <div className="text-2xl font-black font-heading gradient-text-emerald">0–100 Score</div>
              <div className="text-xs text-gray-400 mt-1">Algorithmic MSRP & historical low weighting</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-gray-800/80">
              <div className="text-2xl font-black font-heading text-amber-400">08:00 UTC</div>
              <div className="text-xs text-gray-400 mt-1">Automated daily Email & Discord digests</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Live Hardware Deals Ticker Strip (Marquee) ────────────────── */}
      <div className="border-y border-gray-800 bg-gray-950/60 py-3 overflow-hidden">
        <div className="flex items-center">
          <div className="shrink-0 px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 border-r border-gray-800 z-10 bg-gray-950/90 py-1">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>Live Deal Feed</span>
          </div>
          
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="animate-ticker flex gap-4 pl-4">
              {[...tickerDeals, ...tickerDeals].map((deal, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs font-medium shrink-0"
                >
                  <span className="text-gray-300 font-semibold">{deal.name}</span>
                  <span className="text-cyan-400 font-bold">{deal.price}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Save {deal.save}
                  </span>
                  <span className="text-gray-500 text-[11px]">• {deal.retailer}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    deal.score >= 90 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    Score {deal.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Feature Sandbox Hub ────────────────────────────── */}
      <section id="interactive-demo" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Live Interactive Sandbox
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight">
            Test RigScouter's Core Capabilities
          </h2>
          <p className="text-sm text-gray-400">
            Interact with live simulated previews of our multi-retailer price normalizer, target alert threshold engine, and automated daily digest dispatcher.
          </p>
        </div>

        {/* Sandbox Navigation Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 shadow-inner">
            <button
              onClick={() => setDemoTab('comparison')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                demoTab === 'comparison'
                  ? 'bg-gray-800 text-cyan-300 shadow-lg border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>1. Multi-Retailer Normalizer</span>
            </button>

            <button
              onClick={() => setDemoTab('alerts')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                demoTab === 'alerts'
                  ? 'bg-gray-800 text-purple-300 shadow-lg border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>2. Target Price Alerts</span>
            </button>

            <button
              onClick={() => setDemoTab('digest')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                demoTab === 'digest'
                  ? 'bg-gray-800 text-amber-300 shadow-lg border border-amber-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>3. Automated Daily Digest</span>
            </button>
          </div>
        </div>

        {/* Sandbox Container Card */}
        <div className="glass-card p-6 sm:p-10 rounded-3xl border border-gray-800">
          
          {/* ── Demo 1: Multi-Retailer Comparison Normalizer ─────────────── */}
          {demoTab === 'comparison' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white font-heading">
                      Canonical Grouping: NVIDIA GeForce RTX 4070 Super 12GB
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                      Deal Score: 94/100 (Epic Deal)
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    5 retailers scraped and unified on a single canonical card. Click a retailer to switch price & stock status:
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Lowest Tracked Price</div>
                  <div className="text-2xl font-black text-cyan-400 font-heading">$549.99 <span className="text-xs text-gray-400 line-through">$599.99 MSRP</span></div>
                </div>
              </div>

              {/* Retailer Selector Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { name: 'Micro Center', price: '$549.99', stock: 'In Stock (Lowest)', isLowest: true },
                  { name: 'Amazon', price: '$589.99', stock: 'In Stock', isLowest: false },
                  { name: 'Newegg', price: '$599.99', stock: 'In Stock', isLowest: false },
                  { name: 'Best Buy', price: '$599.99', stock: 'In Stock', isLowest: false },
                  { name: 'B&H Photo', price: '$619.99', stock: 'Backordered', isLowest: false },
                ].map((ret) => (
                  <button
                    key={ret.name}
                    onClick={() => setDemoSelectedRetailer(ret.name)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                      demoSelectedRetailer === ret.name
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{ret.name}</span>
                      {ret.isLowest && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">
                          Best
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-black text-cyan-400 font-heading mt-1">{ret.price}</div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${ret.stock.includes('In Stock') ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span>{ret.stock}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Active Retailer Detail Panel */}
              <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="text-gray-300">
                    Active Retailer Selected: <strong className="text-white">{demoSelectedRetailer}</strong>
                  </div>
                  <div className="text-gray-400">
                    Canonical normalization collapses ASUS Dual, MSI Ventus, and Gigabyte Windforce into standard GPU baseline specs.
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="btn-glow px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Any PC Part in Dashboard</span>
                </Link>
              </div>
            </div>
          )}

          {/* ── Demo 2: Target Alert Price Configurator ──────────────────── */}
          {demoTab === 'alerts' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="border-b border-gray-800 pb-4 text-center">
                <h3 className="text-xl font-bold text-white font-heading">
                  Interactive Target Price Alert Threshold
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Adjust the target price slider to see how RigScouter calculates potential savings and arms automated notification triggers.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400">Component</div>
                    <div className="text-base font-bold text-white">AMD Ryzen 7 7800X3D (8-Core AM5)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Current Lowest (Amazon)</div>
                    <div className="text-xl font-black text-cyan-400 font-heading">$349.99</div>
                  </div>
                </div>

                {/* Interactive Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-purple-400" />
                      <span>Target Alert Price:</span>
                    </label>
                    <span className="text-xl font-black text-purple-400 font-heading">${demoTargetPrice}.00</span>
                  </div>
                  <input
                    type="range"
                    min={280}
                    max={360}
                    step={5}
                    value={demoTargetPrice}
                    onChange={(e) => setDemoTargetPrice(Number(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>$280 (Extreme Drop)</span>
                    <span>$349.99 (Current Price)</span>
                    <span>$360 (MSRP Cap)</span>
                  </div>
                </div>

                {/* Savings & Alert Status */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800 text-center">
                    <div className="text-[11px] text-gray-400">Projected Savings</div>
                    <div className="text-lg font-black text-emerald-400 font-heading">
                      {demoTargetPrice < 349.99 ? `$${(349.99 - demoTargetPrice).toFixed(2)} (${(((349.99 - demoTargetPrice) / 349.99) * 100).toFixed(0)}% Off)` : '$0.00 (At Market)'}
                    </div>
                  </div>
                  <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800 text-center">
                    <div className="text-[11px] text-gray-400">RLS Trigger State</div>
                    <div className="text-sm font-bold text-purple-400 flex items-center justify-center gap-1 mt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{demoTargetPrice >= 349.99 ? 'Triggered Immediately!' : 'Armed & Monitoring'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/dashboard"
                  className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold"
                >
                  <Bell className="w-4 h-4" />
                  <span>Set Up Your Personal Watchlist Now</span>
                </Link>
              </div>
            </div>
          )}

          {/* ── Demo 3: Automated Daily Digest ───────────────────────────── */}
          {demoTab === 'digest' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">
                    Scheduled Daily Briefing (08:00 AM UTC)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Multi-horizon trend deltas: 24h, 7-day, 30-day, and All-Time Low (ATL).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDemoDigestChannel('discord')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      demoDigestChannel === 'discord'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Discord Format</span>
                  </button>

                  <button
                    onClick={() => setDemoDigestChannel('email')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      demoDigestChannel === 'email'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email HTML Format</span>
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              {demoDigestChannel === 'discord' ? (
                <div className="bg-[#1e1f22] p-5 rounded-2xl border border-indigo-500/30 font-mono text-xs text-gray-200 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <span>🤖 RigScouter-AI Daily Digest</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">BOT</span>
                  </div>
                  <div className="text-gray-300 leading-relaxed">
                    **Today's Executive Summary:** 3 of your 6 tracked hardware components dropped in price over the last 24h. Total potential savings: **$189.99**.
                  </div>
                  <div className="bg-[#2b2d31] p-3 rounded-xl border border-gray-800 space-y-1.5">
                    <div className="text-emerald-400 font-bold">🟢 RTX 4070 Super 12GB: $549.99 (Save $50)</div>
                    <div className="text-gray-400 text-[11px]">• 24h Delta: -8.3% • 7d Delta: -8.3% • All-Time Low: $549.99 (ATL Match!) • Micro Center</div>
                  </div>
                  <div className="bg-[#2b2d31] p-3 rounded-xl border border-gray-800 space-y-1.5">
                    <div className="text-emerald-400 font-bold">🟢 Ryzen 7 7800X3D: $349.99 (Save $99)</div>
                    <div className="text-gray-400 text-[11px]">• 24h Delta: -5.4% • 30d Delta: -12.5% • Deal Score: 96/100 • Amazon</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="font-bold text-white text-sm">📬 Morning Hardware Digest — Sept 2, 2026</div>
                    <div className="text-xs text-cyan-400 font-mono">Sent to user@example.com</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
                      <div className="text-gray-400 text-[11px]">Biggest Daily Price Drop</div>
                      <div className="text-white font-bold">Sapphire Pulse RX 7900 XTX 24GB</div>
                      <div className="text-emerald-400 font-extrabold text-sm">$889.99 <span className="text-xs line-through text-gray-500">$999.99</span></div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
                      <div className="text-gray-400 text-[11px]">All-Time Low Records</div>
                      <div className="text-white font-bold">Samsung 990 Pro 2TB NVMe</div>
                      <div className="text-purple-400 font-extrabold text-sm">$149.99 (Historical Best)</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center">
                <Link
                  href="/dashboard"
                  className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold"
                >
                  <Mail className="w-4 h-4" />
                  <span>Configure Your Daily Digest Settings</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── The 4 Core Architectural Pillars ────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <Layers className="w-3.5 h-3.5" /> Engineered for Speed & Accuracy
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight">
            The 4 Pillars of RigScouter-AI
          </h2>
          <p className="text-sm text-gray-400">
            Learn what makes RigScouter-AI different from traditional scrapers and browser extensions.
          </p>
        </div>

        {/* Feature 1: Multi-Retailer Scraper */}
        <div id="scraper" className="glass-card p-8 md:p-10 rounded-3xl border border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Pillar 1</span>
            <h3 className="text-2xl md:text-3xl font-bold text-white font-heading">
              Autonomous Multi-Retailer Web Scraper
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Powered by cloud-rendered headless browsers, RigScouter bypasses JavaScript anti-bot checks across Micro Center, Amazon, Newegg, Best Buy, and B&H Photo to extract real-time pricing and stock status.
            </p>
            <ul className="space-y-2 text-xs text-gray-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Extracts structured JSON: current price, MSRP, stock status, and direct product URL.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Heuristic normalization collapses board partner variations (ASUS Dual, MSI Ventus, Gigabyte Gaming) into canonical base models.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Strict hardware validation rejects non-PC queries instantaneously.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-5 bg-gray-900/90 p-6 rounded-2xl border border-gray-800 font-mono text-xs text-gray-300 space-y-3">
            <div className="text-[11px] text-cyan-400 font-bold border-b border-gray-800 pb-2">
              // Normalized Hardware Schema
            </div>
            <pre className="text-[11px] text-emerald-300 overflow-x-auto">
{`{
  "canonicalModel": "RTX 4070 Super",
  "category": "GPU",
  "lowestPrice": 549.99,
  "msrp": 599.99,
  "retailers": {
    "Micro Center": 549.99,
    "Amazon": 589.99,
    "Newegg": 599.99,
    "Best Buy": 599.99
  },
  "dealScore": 94,
  "stockStatus": "In Stock"
}`}
            </pre>
          </div>
        </div>

        {/* Feature 2: AI Deal Scoring */}
        <div id="scoring" className="glass-card p-8 md:p-10 rounded-3xl border border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 bg-gray-900/90 p-6 rounded-2xl border border-gray-800 font-mono text-xs text-gray-300 space-y-3 order-2 lg:order-1">
            <div className="text-[11px] text-purple-400 font-bold border-b border-gray-800 pb-2">
              // Deal Score Breakdown (0–100)
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between text-orange-400 font-bold">
                <span>🔥 90 – 100</span>
                <span>Epic Deal (Steep drop / ATL)</span>
              </div>
              <div className="flex justify-between text-cyan-400 font-bold">
                <span>⚡ 80 – 89</span>
                <span>Great Deal (Below 90d low)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>⚖️ 65 – 79</span>
                <span>Fair Price (Near MSRP)</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>⚠️ &lt; 65</span>
                <span>Overpriced / Scalped</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Pillar 2</span>
            <h3 className="text-2xl md:text-3xl font-bold text-white font-heading">
              Algorithmic AI Deal Scoring Engine
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Don't be fooled by fake "discounts" that mark up MSRP before discounting. Our quantitative Deal Score analyzes MSRP variance, 90-day historical lowest pricing, retailer competition, and stock availability to give you a definitive 0–100 score.
            </p>
          </div>
        </div>

        {/* Feature 3: Personalized Watchlist & RLS */}
        <div id="watchlist" className="glass-card p-8 md:p-10 rounded-3xl border border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Pillar 3</span>
            <h3 className="text-2xl md:text-3xl font-bold text-white font-heading">
              Personalized Watchlist & Supabase RLS
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your hardware watchlist, alert price thresholds, and custom preferences are stored securely with PostgreSQL Row-Level Security. Only you have access to your private tracking list.
            </p>
            <ul className="space-y-2 text-xs text-gray-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sub-20ms instant database reads with zero API blocking on page load.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Custom Target Price thresholds automatically calculate savings and flag flash drops.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cross-device synchronization via Supabase Auth.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-5 bg-gray-900/90 p-6 rounded-2xl border border-gray-800 font-mono text-xs text-gray-300 space-y-3">
            <div className="text-[11px] text-emerald-400 font-bold border-b border-gray-800 pb-2 flex items-center justify-between">
              <span>// Supabase RLS Policy</span>
              <span className="text-emerald-400">ENFORCED</span>
            </div>
            <pre className="text-[11px] text-emerald-300 overflow-x-auto">
{`CREATE POLICY "User Watchlist Isolation"
  ON watchlist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);`}
            </pre>
          </div>
        </div>

        {/* Feature 4: Automated Daily Price Digest */}
        <div id="digest" className="glass-card p-8 md:p-10 rounded-3xl border border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 bg-gray-900/90 p-6 rounded-2xl border border-gray-800 space-y-3 text-xs order-2 lg:order-1">
            <div className="font-bold text-amber-400 border-b border-gray-800 pb-2">
              📬 Automated Daily Cron Dispatch
            </div>
            <div className="space-y-2 text-gray-300 text-[11px]">
              <div className="flex justify-between"><span>Schedule:</span><span className="text-white font-mono font-bold">Daily @ 08:00 AM UTC</span></div>
              <div className="flex justify-between"><span>Delivery Channels:</span><span className="text-cyan-400 font-bold">Email & Discord Webhooks</span></div>
              <div className="flex justify-between"><span>Trend Analysis:</span><span className="text-purple-400 font-bold">24h / 7d / 30d / All-Time Low</span></div>
              <div className="flex justify-between"><span>Automator Status:</span><span className="text-emerald-400 font-bold">Active & Dispatched</span></div>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Mail className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pillar 4</span>
            <h3 className="text-2xl md:text-3xl font-bold text-white font-heading">
              Automated Daily Price Digest & Cron Job
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Never miss a flash deal again. Subscribed users receive scheduled daily briefings delivered straight to their Email inbox or Discord channel with executive price drop summaries and multi-horizon trend deltas.
            </p>
          </div>
        </div>

      </section>

      {/* ── Hardware Deal Benchmarks Table ─────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Live Market Intelligence</span>
            <h2 className="text-3xl font-black font-heading text-white tracking-tight mt-1">
              Top Hardware Deals Tracked
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Real-time lowest prices and AI deal scores across our monitored retail network.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="btn-glass px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start md:self-auto"
          >
            <span>View Complete Watchlist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card overflow-hidden border border-gray-800 rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/70 text-gray-400 font-semibold">
                  <th className="py-4 px-6">Hardware Component</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Lowest Price</th>
                  <th className="py-4 px-4">MSRP</th>
                  <th className="py-4 px-4">Lowest Retailer</th>
                  <th className="py-4 px-4">Deal Score</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-medium">
                {hardwareMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">
                      {item.name}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-cyan-400 font-mono text-sm">
                      ${item.lowestPrice.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-mono">
                      ${item.msrp.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{item.retailer}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        item.dealScore >= 90
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {item.dealScore}/100
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href="/dashboard"
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] transition-all"
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

      {/* ── Supported Retailers Grid ───────────────────────────────────── */}
      <section id="retailers" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Monitored Retailer Network</span>
          <h2 className="text-3xl font-black font-heading text-white tracking-tight">
            5 Major Retailers Tracked Continuously
          </h2>
          <p className="text-xs text-gray-400">
            Real-time scraping with anti-bot evasion across the top PC hardware destinations.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'Micro Center', type: 'In-Store & Online', badge: 'Verified Partner', status: 'Online', latency: '420ms' },
            { name: 'Amazon', type: 'Global Direct & Prime', badge: 'Verified Scraper', status: 'Online', latency: '310ms' },
            { name: 'Newegg', type: 'Direct & Marketplace', badge: 'Verified Scraper', status: 'Online', latency: '380ms' },
            { name: 'Best Buy', type: 'Retail & Online', badge: 'Verified Scraper', status: 'Online', latency: '450ms' },
            { name: 'B&H Photo', type: 'Authorized Dealer', badge: 'Verified Scraper', status: 'Online', latency: '290ms' },
          ].map((ret) => (
            <div key={ret.name} className="glass-card p-5 rounded-2xl border border-gray-800 text-center space-y-2">
              <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center mx-auto text-cyan-400">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">{ret.name}</h3>
              <p className="text-[11px] text-gray-400">{ret.type}</p>
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{ret.status}</span>
                </span>
                <span className="font-mono text-cyan-400">{ret.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison Table: RigScouter vs Others ─────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Why RigScouter-AI</span>
          <h2 className="text-3xl font-black font-heading text-white tracking-tight">
            How We Compare to Traditional Tools
          </h2>
        </div>

        <div className="glass-card overflow-hidden border border-gray-800 rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/70 text-gray-400 font-semibold">
                  <th className="py-4 px-6">Feature</th>
                  <th className="py-4 px-6 text-cyan-400 font-bold">RigScouter-AI</th>
                  <th className="py-4 px-6 text-gray-400">PCPartPicker</th>
                  <th className="py-4 px-6 text-gray-400">Honey / Chrome Extensions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-medium">
                {[
                  { feature: 'Autonomous Cloud Headless Scraper', rs: true, pcpp: false, honey: false },
                  { feature: 'Micro Center In-Store & Online Tracking', rs: true, pcpp: true, honey: false },
                  { feature: 'Algorithmic AI Deal Scoring (0–100)', rs: true, pcpp: false, honey: false },
                  { feature: 'Scheduled Daily Discord Webhook Digest', rs: true, pcpp: false, honey: false },
                  { feature: 'Scheduled Morning Email HTML Briefing', rs: true, pcpp: false, honey: true },
                  { feature: 'Multi-Horizon Trend Deltas (24h/7d/30d/ATL)', rs: true, pcpp: false, honey: false },
                  { feature: 'Private Row-Level Security (Supabase RLS)', rs: true, pcpp: false, honey: false },
                  { feature: 'Sub-20ms Direct Database Query Latency', rs: true, pcpp: false, honey: false },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3.5 px-6 text-white font-medium">{row.feature}</td>
                    <td className="py-3.5 px-6">
                      {row.rs ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Yes
                        </span>
                      ) : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="py-3.5 px-6">
                      {row.pcpp ? (
                        <span className="flex items-center gap-1.5 text-gray-300">
                          <Check className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : <span className="text-gray-500">No</span>}
                    </td>
                    <td className="py-3.5 px-6">
                      {row.honey ? (
                        <span className="flex items-center gap-1.5 text-gray-300">
                          <Check className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : <span className="text-gray-500">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 3-Step "How It Works" Pipeline ─────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Automated Workflow</span>
          <h2 className="text-3xl font-black font-heading text-white tracking-tight">
            How RigScouter-AI Works Under the Hood
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-heading">
              1
            </div>
            <h3 className="text-base font-bold text-white">Autonomous Cloud Crawl</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Headless browser agents render dynamic JavaScript and bypass anti-bot challenges across Micro Center, Amazon, Newegg, Best Buy, and B&H Photo.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold font-heading">
              2
            </div>
            <h3 className="text-base font-bold text-white">AI Deal Scoring & RLS Filter</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Our scoring model normalizes partner models, computes MSRP discounts and historical lows, and triggers target price alerts in Supabase.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-heading">
              3
            </div>
            <h3 className="text-base font-bold text-white">Instant Alert & Daily Dispatch</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Receive instant savings alerts in your dashboard and scheduled daily digests sent directly to your Email inbox and Discord channel at 08:00 AM UTC.
            </p>
          </div>
        </div>
      </section>

      {/* ── High-Converting Bottom CTA ─────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative glass-card p-8 sm:p-14 rounded-3xl border border-cyan-500/30 text-center space-y-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-purple-600/10 pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight">
              Ready to Track PC Hardware Deals Autonomously?
            </h2>
            <p className="text-sm text-gray-300">
              Launch the live dashboard or sign in to configure your personalized hardware watchlist and automated daily price digest.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto btn-glow px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25"
              >
                <Bell className="w-4 h-4" />
                <span>Launch Live Dashboard</span>
              </Link>

              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-full sm:w-auto btn-glass px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>Sign In / Create Account</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modern Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800/80 bg-gray-950/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black font-heading tracking-tight text-white">
                RigScouter<span className="text-cyan-400">-AI</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-400 font-medium">
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link href="/features" className="hover:text-white transition-colors">Technical Architecture</Link>
              <a href="#scraper" className="hover:text-white transition-colors">Scraper</a>
              <a href="#scoring" className="hover:text-white transition-colors">Deal Scoring</a>
              <a href="#digest" className="hover:text-white transition-colors">Daily Digest</a>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Automator: <strong className="text-emerald-400">08:00 UTC Active</strong></span>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              © 2026 RigScouter-AI • Autonomous PC Hardware Deal Scouting Engine
            </div>
            <div className="font-mono text-[11px] text-gray-500">
              Next.js 15 • Supabase PostgreSQL (RLS Protected) • Tailwind CSS
            </div>
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
