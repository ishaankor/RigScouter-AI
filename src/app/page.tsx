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
  Server,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const [demoTab, setDemoTab] = useState<'comparison' | 'digest'>('comparison');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('eBay');
  const [digestChannel, setDigestChannel] = useState<'discord' | 'email'>('discord');

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

  const [topDeals, setTopDeals] = useState<any[]>([
    { id: '1', name: 'ASUS TUF Gaming X870-PLUS WiFi AM5 ATX Motherboard', category: 'Motherboard', price: 149.00, msrp: 229.99, retailer: 'Amazon', score: 99, cut: '-35%' },
    { id: '2', name: 'AMD Ryzen 7 9800X3D 8-Core Desktop Processor', category: 'CPU', price: 369.99, msrp: 479.99, retailer: 'eBay', score: 98, cut: '-23%' },
    { id: '3', name: 'ASUS Dual GeForce RTX 3060 V2 12GB GDDR6 OC Edition', category: 'GPU', price: 259.99, msrp: 449.99, retailer: 'eBay', score: 95, cut: '-42%' },
    { id: '4', name: 'GIGABYTE B850M GAMING X WIFI6E AM5 DDR5 mATX Board', category: 'Motherboard', price: 123.50, msrp: 159.99, retailer: 'eBay', score: 94, cut: '-23%' },
    { id: '5', name: 'Sceptre 22-Inch 1080p 144Hz Gaming Display Monitor', category: 'Monitor', price: 62.97, msrp: 89.99, retailer: 'Amazon', score: 95, cut: '-30%' },
    { id: '6', name: 'ASUS ROG Strix GeForce GTX 1080 Ti 11GB OC Edition', category: 'GPU', price: 120.00, msrp: 399.00, retailer: 'eBay', score: 92, cut: '-70%' },
  ]);

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
    <div className="site-wrapper">
      
      {/* ── Semantic Site Header ─────────────────────────────────────────── */}
      <header role="banner" className="site-header">
        <div className="header-inner">
          
          <Link href="/" className="brand-link" aria-label="RigScouter AI Home">
            <div className="brand-icon">
              <Cpu className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="brand-text">
              RigScouter<span className="text-cyan-400">-AI</span>
            </span>
          </Link>

          <nav aria-label="Primary Navigation" className="site-nav">
            <Link href="/features" className="site-nav-link">Features</Link>
            <Link href="/deal-scoring" className="site-nav-link">Deal Scoring</Link>
            <Link href="/methodology" className="site-nav-link">Methodology</Link>
            <a href="#pipeline" className="site-nav-link">Architecture</a>
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="user-badge">
                <div className="user-avatar">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <span className="text-gray-300 font-medium max-w-xs truncate">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign out of account"
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                aria-label="Sign in to your account"
                className="sign-in-btn"
              >
                Sign In
              </button>
            )}

            <Link
              href="/dashboard"
              aria-label="Launch RigScouter Live Application"
              className="rs-btn-primary"
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
      <section aria-labelledby="hero-heading" className="hero-section">
        
        <div className="hero-badge-pill">
          <span className="status-dot-live" aria-hidden="true" />
          <span>Real-Time PC Hardware Market Intelligence</span>
        </div>

        <h1 id="hero-heading" className="hero-title">
          Autonomous PC Hardware
          <span className="block mt-2 sm:mt-3 text-cyan-400">
            Market Intelligence
          </span>
        </h1>

        <p className="hero-subtitle">
          RigScouter continuously crawls Amazon and eBay in real-time, with Best Buy in active validation and Micro Center, Newegg, and B&amp;H Photo coming online. We compute deep algorithmic deal scores (0–100) and dispatch automated price briefings directly to your Email and Discord webhook.
        </p>

        <div className="hero-cta-group">
          <Link
            href="/dashboard"
            className="rs-btn-primary px-6 py-2.5"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span>Launch Watchlist Tracker</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>

          <a
            href="#demo"
            className="rs-btn-secondary px-5 py-2.5"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>View Live Engine</span>
          </a>
        </div>

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

      {/* ── Live Ticker Strip ─────────────────────────────────────────── */}
      <section aria-label="Live Market Price Drops" className="marquee-bar">
        <div className="marquee-wrapper">
          <div className="marquee-label">
            <Flame className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
            <span>Market Feed</span>
          </div>
          
          <div className="marquee-viewport">
            <div className="marquee-fade-left" />
            <div className="marquee-fade-right" />

            <div className="marquee-track animate-marquee">
              {(tickerDeals.length >= 8 ? tickerDeals : [...tickerDeals, ...tickerDeals, ...tickerDeals])
                .filter(deal => deal && deal.name && deal.price)
                .map((deal, idx) => (
                  <div key={`track1-${idx}`} className="marquee-pill">
                    <span className="text-gray-200">{deal.name}</span>
                    <span className="text-cyan-400 font-bold">{deal.price}</span>
                    {deal.save && (
                      <span className="chip chip-cut">
                        Save {deal.save}
                      </span>
                    )}
                    <span className="chip chip-retailer">
                      {deal.retailer}
                    </span>
                    {deal.score && (
                      <span className="chip chip-save">
                        Score {deal.score}
                      </span>
                    )}
                  </div>
                ))}
            </div>

            <div aria-hidden="true" className="marquee-track animate-marquee">
              {(tickerDeals.length >= 8 ? tickerDeals : [...tickerDeals, ...tickerDeals, ...tickerDeals])
                .filter(deal => deal && deal.name && deal.price)
                .map((deal, idx) => (
                  <div key={`track2-${idx}`} className="marquee-pill">
                    <span className="text-gray-200">{deal.name}</span>
                    <span className="text-cyan-400 font-bold">{deal.price}</span>
                    {deal.save && (
                      <span className="chip chip-cut">
                        Save {deal.save}
                      </span>
                    )}
                    <span className="chip chip-retailer">
                      {deal.retailer}
                    </span>
                    {deal.score && (
                      <span className="chip chip-save">
                        Score {deal.score}
                      </span>
                    )}
                  </div>
                ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Interactive Demo Preview Section ──────────────────────────── */}
      <section id="demo" aria-labelledby="demo-heading" className="section-container">
        
        <header className="section-header">
          <span className="section-kicker">Interactive Product Preview</span>
          <h2 id="demo-heading" className="section-title">
            Component Price Engine Architecture
          </h2>
          <p className="section-lead">
            Explore live multi-retailer price comparisons and preview morning automated alert digests.
          </p>
        </header>

        <div className="demo-tabs-wrap">
          <div role="tablist" aria-label="Demo Views" className="demo-tab-list">
            <button
              role="tab"
              aria-selected={demoTab === 'comparison'}
              onClick={() => setDemoTab('comparison')}
              className={`demo-tab-btn ${demoTab === 'comparison' ? 'demo-tab-btn-active' : ''}`}
            >
              Multi-Retailer Price Comparison
            </button>
            <button
              role="tab"
              aria-selected={demoTab === 'digest'}
              onClick={() => setDemoTab('digest')}
              className={`demo-tab-btn ${demoTab === 'digest' ? 'demo-tab-btn-active' : ''}`}
            >
              Daily Alert Digest Preview
            </button>
          </div>
        </div>

        {demoTab === 'comparison' ? (
          <div className="demo-box">
            
            <div className="demo-header">
              <div>
                <div className="flex items-center gap-2">
                  <span className="demo-title">{featuredComparison.name}</span>
                  <span className="demo-category-pill">{featuredComparison.category}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  AI Deal Score:{' '}
                  <span className="text-emerald-400 font-bold">{featuredComparison.score}/100</span>
                  {' '}• {featuredComparison.dealTag}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-400">Lowest Monitored Price</div>
                <div className="text-xl font-bold text-cyan-400">{featuredComparison.lowestPrice}</div>
                <div className="text-xs text-gray-500 line-through">MSRP: {featuredComparison.msrp}</div>
              </div>
            </div>

            <div className="demo-retailers-grid">
              {featuredComparison.retailers.map((r: any) => (
                <button
                  key={r.name}
                  onClick={() => setSelectedRetailer(r.name)}
                  className={`retailer-card-btn ${selectedRetailer === r.name ? 'retailer-card-btn-active' : ''}`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-xs font-semibold text-white truncate">{r.name}</span>
                    {r.isLowest && (
                      <span className="chip chip-cut">LOWEST</span>
                    )}
                    {r.status === 'testing' && (
                      <span className="chip chip-cut text-cyan-300">TESTING</span>
                    )}
                    {r.status === 'soon' && (
                      <span className="chip chip-save">SOON</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-cyan-400 mt-1">{r.price}</div>
                  <div className="text-xs text-gray-400">{r.stock}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 text-xs text-gray-400 border-t border-gray-800 mt-4">
              <span>Selected Retailer: <strong className="text-white">{selectedRetailer}</strong></span>
              <Link href="/dashboard" className="rs-btn-secondary">
                <span>Track in Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

          </div>
        ) : (
          <div className="demo-box">
            
            <div className="demo-header">
              <div>
                <span className="demo-title">Automated Morning Briefing Preview (08:00 UTC)</span>
                <div className="text-xs text-gray-400 mt-1">
                  Delivered automatically when tracked items drop below target thresholds.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDigestChannel('discord')}
                  className={`demo-tab-btn ${digestChannel === 'discord' ? 'demo-tab-btn-active' : ''}`}
                >
                  Discord Embed
                </button>
                <button
                  onClick={() => setDigestChannel('email')}
                  className={`demo-tab-btn ${digestChannel === 'email' ? 'demo-tab-btn-active' : ''}`}
                >
                  Email Briefing
                </button>
              </div>
            </div>

            <div className="digest-preview-box mt-4">
              <div className="text-cyan-400 font-bold">
                [RIGSCOUTER-DISPATCH] Daily Price Drop Digest • 2 Deals Triggered
              </div>
              <div className="text-gray-400 text-xs">
                Channel: {digestChannel === 'discord' ? 'Discord Webhook (#rig-alerts)' : 'Verified Email Delivery'}
              </div>
              <div className="border-t border-gray-800 pt-2 space-y-1 text-xs">
                <div>
                  • <span className="text-white font-bold">ASUS TUF Gaming X870-PLUS WiFi AM5</span>: <span className="text-emerald-400 font-bold">$149.00</span> on Amazon (35% under MSRP, Score: 99/100)
                </div>
                <div>
                  • <span className="text-white font-bold">Ryzen 7 9800X3D Desktop Processor</span>: <span className="text-emerald-400 font-bold">$369.99</span> on eBay (Save $110, Score: 98/100)
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-2">
              <Link href="/dashboard" className="rs-btn-primary">
                <span>Configure Alert Preferences</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

          </div>
        )}

      </section>

      {/* ── Key Features ──────────────────────────────────────────────── */}
      <section id="features" aria-labelledby="features-heading" className="section-container">
        <header className="section-header">
          <span className="section-kicker">Core System Architecture</span>
          <h2 id="features-heading" className="section-title">
            Deal Evaluation &amp; Alert Engine
          </h2>
          <p className="section-lead">
            Three independent layers handle extraction, statistical scoring, and notification dispatch without human intervention.
          </p>
        </header>

        <div className="feature-grid">
          
          <article className="feature-card">
            <div className="feature-icon-box bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Globe className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="feature-title">Multi-Retailer Scraping</h3>
            <p className="feature-text">
              Real-time monitoring across Amazon and eBay with 2-cycle grace periods for temporary rate-limiting, out-of-stock validation, and automatic stock failover hot-swapping.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon-box bg-purple-950 border border-purple-800 text-purple-400">
              <BarChart3 className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="feature-title">AI Deal Scoring (0–100)</h3>
            <p className="feature-text">
              Statistical discount evaluation comparing listings against rolling 90-day historic all-time lows (45%), manufacturer MSRP (35%), and cross-retailer pricing spread (20%).
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon-box bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Mail className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="feature-title">Automated Daily Digest</h3>
            <p className="feature-text">
              Automated briefing engine executing daily at 08:00 UTC, summarizing newly triggered price drops and dispatching formatted payloads to Discord webhooks and email.
            </p>
          </article>

        </div>
      </section>

      {/* ── Architecture Pipeline ────────────────────────────────────── */}
      <section id="pipeline" aria-labelledby="pipeline-heading" className="section-container">
        <header className="section-header">
          <span className="section-kicker">Reliability Engineering</span>
          <h2 id="pipeline-heading" className="section-title">
            Data Ingestion &amp; Verification Pipeline
          </h2>
          <p className="section-lead">
            When hardware retail APIs enforce anti-bot restrictions, our multi-tiered failover pipeline guarantees continuous price accuracy.
          </p>
        </header>

        <div className="pipeline-grid">
          <div className="pipeline-card">
            <div className="pipeline-header-row">
              <span className="pipeline-step-badge bg-cyan-950 text-cyan-300 border border-cyan-800">TIER 1</span>
              <h3 className="pipeline-card-title">Direct OAuth 2.0 REST API</h3>
            </div>
            <p className="pipeline-card-text">
              Official eBay Browse API integration utilizing client credentials for real-time inventory queries and verified condition parsing.
            </p>
          </div>

          <div className="pipeline-card">
            <div className="pipeline-header-row">
              <span className="pipeline-step-badge bg-blue-950 text-blue-300 border border-blue-800">TIER 2</span>
              <h3 className="pipeline-card-title">TLS Fingerprint Impersonation</h3>
            </div>
            <p className="pipeline-card-text">
              Automated curl-impersonate client matching browser JA3/JA4 TLS signatures and HTTP/2 framing to bypass bot mitigations.
            </p>
          </div>

          <div className="pipeline-card">
            <div className="pipeline-header-row">
              <span className="pipeline-step-badge bg-purple-950 text-purple-300 border border-purple-800">TIER 3</span>
              <h3 className="pipeline-card-title">All Offers Display (AOD) Extraction</h3>
            </div>
            <p className="pipeline-card-text">
              Specialized extraction verifying Brand New Buy Box pricing over open-box, renewed, or third-party seller variations.
            </p>
          </div>

          <div className="pipeline-card">
            <div className="pipeline-header-row">
              <span className="pipeline-step-badge bg-emerald-950 text-emerald-300 border border-emerald-800">TIER 4</span>
              <h3 className="pipeline-card-title">Real-Time Search AI Fallback</h3>
            </div>
            <p className="pipeline-card-text">
              Fallback scraper with exact-match model verification ensuring alerts only trigger on authentic product listings.
            </p>
          </div>
        </div>
      </section>

      {/* ── Top Deals Table ───────────────────────────────────────────── */}
      <section id="deals" aria-labelledby="deals-heading" className="section-container">
        
        <div className="deals-header-row">
          <div>
            <span className="section-kicker">Live Database Feed</span>
            <h2 id="deals-heading" className="section-title">
              Top Hardware Deals
            </h2>
          </div>
          <Link href="/dashboard" className="deals-link-more">
            <span>Explore All Watchlist Items</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="deals-table-container">
          <table className="deals-table">
            <thead>
              <tr>
                <th scope="col" className="deals-th">Hardware Component</th>
                <th scope="col" className="deals-th">Category</th>
                <th scope="col" className="deals-th">Best Price</th>
                <th scope="col" className="deals-th">Retailer</th>
                <th scope="col" className="deals-th">AI Score</th>
                <th scope="col" className="deals-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {topDeals.map((deal) => (
                <tr key={deal.id}>
                  <td className="deals-td font-semibold text-white">
                    {deal.name}
                  </td>
                  <td className="deals-td">
                    <span className="demo-category-pill">{deal.category}</span>
                  </td>
                  <td className="deals-td font-mono font-bold text-cyan-400">
                    ${typeof deal.price === 'number' ? deal.price.toFixed(2) : deal.price}
                    {deal.cut && (
                      <span className="ml-1 text-emerald-400 font-semibold">{deal.cut}</span>
                    )}
                  </td>
                  <td className="deals-td text-gray-300">
                    {deal.retailer}
                  </td>
                  <td className="deals-td">
                    <span className="chip chip-save">
                      {deal.score}/100
                    </span>
                  </td>
                  <td className="deals-td text-right">
                    <Link
                      href="/dashboard"
                      className="rs-btn-secondary py-1 px-2.5 text-xs"
                    >
                      Track
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>

      {/* ── Monitored Retailers Grid ──────────────────────────────────── */}
      <section id="retailers" aria-labelledby="retailers-heading" className="section-container">
        <header className="section-header">
          <span className="section-kicker">Supported Ecosystem</span>
          <h2 id="retailers-heading" className="section-title">
            Multi-Retailer Pricing Matrix
          </h2>
          <p className="section-lead">
            Live retail endpoints, testing validation status, and planned roadmap integrations.
          </p>
        </header>

        <ul role="list" className="retailer-grid">
          <li role="listitem" className="retailer-card">
            <span className="retailer-name-text">Amazon</span>
            <span className="retailer-status-badge text-emerald-400">
              <span className="status-dot-active" aria-hidden="true" />
              <span>LIVE</span>
            </span>
          </li>
          <li role="listitem" className="retailer-card">
            <span className="retailer-name-text">eBay</span>
            <span className="retailer-status-badge text-emerald-400">
              <span className="status-dot-active" aria-hidden="true" />
              <span>LIVE</span>
            </span>
          </li>
          <li role="listitem" className="retailer-card">
            <span className="retailer-name-text">Best Buy</span>
            <span className="retailer-status-badge text-cyan-400">
              <span className="status-dot-testing" aria-hidden="true" />
              <span>TESTING</span>
            </span>
          </li>
          <li role="listitem" className="retailer-card">
            <span className="retailer-name-text">Micro Center</span>
            <span className="retailer-status-badge text-amber-400">
              <span className="status-dot-soon" aria-hidden="true" />
              <span>SOON</span>
            </span>
          </li>
          <li role="listitem" className="retailer-card">
            <span className="retailer-name-text">Newegg</span>
            <span className="retailer-status-badge text-amber-400">
              <span className="status-dot-soon" aria-hidden="true" />
              <span>SOON</span>
            </span>
          </li>
          <li role="listitem" className="retailer-card">
            <span className="retailer-name-text">B&amp;H Photo</span>
            <span className="retailer-status-badge text-amber-400">
              <span className="status-dot-soon" aria-hidden="true" />
              <span>SOON</span>
            </span>
          </li>
        </ul>
      </section>

      {/* ── Bottom CTA Banner ──────────────────────────────────────────── */}
      <section aria-labelledby="cta-heading" className="section-container">
        <div className="cta-box">
          <h2 id="cta-heading" className="cta-title">
            Automate Your Hardware Price Tracking
          </h2>
          <p className="section-lead">
            Launch the live dashboard to search desktop components, set target price alert thresholds, and receive automated briefings.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="rs-btn-primary px-6 py-2.5"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span>Launch Live Dashboard</span>
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* ── Semantic Site Footer ────────────────────────────────────────── */}
      <footer role="contentinfo" className="site-footer">
        <div className="footer-inner">
          <div className="footer-row">
            <div className="footer-brand">
              <Cpu className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span>RigScouter-AI</span>
            </div>
            <div className="footer-copyright">
              © 2026 RigScouter-AI • Autonomous PC Hardware Intelligence
            </div>
            <nav aria-label="Footer Navigation" className="footer-nav">
              <Link href="/dashboard" className="footer-link">Dashboard</Link>
              <Link href="/features" className="footer-link">Features</Link>
              <Link href="/deal-scoring" className="footer-link">Deal Scoring</Link>
              <Link href="/methodology" className="footer-link">Methodology</Link>
              <Link href="/privacy" className="footer-link">Privacy</Link>
              <Link href="/terms" className="footer-link">Terms</Link>
            </nav>
          </div>
          <p className="footer-disclaimer">
            RigScouter AI is an independent automated price intelligence engine tracking computer hardware components across major global retail platforms. All product trademarks, model names, and manufacturer logos are the property of their respective owners.
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </div>
  );
}
