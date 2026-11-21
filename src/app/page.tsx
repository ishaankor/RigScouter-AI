'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/db/supabase';
import { AuthModal } from '../components/AuthModal';
import {
  Cpu,
  Bell,
  Sparkles,
  LogOut,
  ArrowRight,
  Globe,
  Mail,
  Flame,
  BarChart3
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
              <Cpu className="brand-icon-svg" aria-hidden="true" />
            </div>
            <span className="brand-title">
              RigScouter<span className="brand-accent">-AI</span>
            </span>
          </Link>

          <nav aria-label="Primary Navigation" className="site-nav">
            <Link href="/features" className="site-nav-link">Features</Link>
            <Link href="/deal-scoring" className="site-nav-link">Deal Scoring</Link>
            <Link href="/methodology" className="site-nav-link">Methodology</Link>
            <a href="#architecture" className="site-nav-link">Architecture</a>
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="user-badge">
                <div className="user-avatar">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <span className="user-email">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign out of account"
                  className="sign-out-btn"
                >
                  <LogOut className="sign-out-icon" aria-hidden="true" />
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
              className="launch-btn"
            >
              <span>Launch App</span>
              <ArrowRight className="launch-btn-icon" aria-hidden="true" />
            </Link>
          </div>

        </div>
      </header>

      {/* ── Main Landmark ───────────────────────────────────────────────── */}
      <main id="main-content" role="main">

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section id="overview" aria-labelledby="hero-heading" className="hero-section">
        
        {/* <div className="hero-badge-pill">
          <span className="status-dot-live" aria-hidden="true" />
          <span>Real-Time PC Hardware Market Intelligence</span>
        </div> */}

        <h1 id="hero-heading" className="hero-title">
          Autonomous PC Hardware
          <span className="hero-title-accent">
            Market Intelligence
          </span>
        </h1>

        <p className="hero-subtitle">
          RigScouter continuously crawls Amazon and eBay in real-time, with Best Buy in active validation and Micro Center, Newegg, and B&amp;H Photo coming online. We compute deep algorithmic deal scores (0–100) and dispatch automated price briefings directly to your Email and Discord webhook.
        </p>

        <div className="hero-cta-group">
          <Link
            href="/dashboard"
            className="hero-primary-btn"
          >
            <Bell className="btn-icon" aria-hidden="true" />
            <span>Launch Watchlist Tracker</span>
            <ArrowRight className="btn-icon" aria-hidden="true" />
          </Link>

          <a
            href="#workbench"
            className="hero-secondary-btn"
          >
            <Sparkles className="btn-icon-cyan" aria-hidden="true" />
            <span>Interactive Demo</span>
          </a>
        </div>

        <dl className="stats-dl" aria-label="System Performance Metrics">
          <div className="stats-item">
            <dt className="stats-dt">Multi-Retailer</dt>
            <dd className="stats-dd">Amazon, eBay (Live) + More</dd>
          </div>
          <div className="stats-item">
            <dt className="stats-dt stats-dt-accent">&lt; 20ms</dt>
            <dd className="stats-dd">Instant Supabase RLS load</dd>
          </div>
          <div className="stats-item">
            <dt className="stats-dt stats-dt-emerald">0–100</dt>
            <dd className="stats-dd">AI Deal Score algorithm</dd>
          </div>
          <div className="stats-item">
            <dt className="stats-dt stats-dt-purple">08:00 UTC</dt>
            <dd className="stats-dd">Automated Daily Digest</dd>
          </div>
        </dl>

      </section>

      {/* ── Live Ticker Strip ─────────────────────────────────────────── */}
      <section aria-label="Live Market Price Drops" className="marquee-bar">
        <div className="marquee-wrapper">
          <div className="marquee-label">
            <Flame className="marquee-label-icon" aria-hidden="true" />
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
                    <span className="pill-name">{deal.name}</span>
                    <span className="pill-price">{deal.price}</span>
                    {deal.save && (
                      <span className="pill-chip-cut">
                        Save {deal.save}
                      </span>
                    )}
                    <span className="pill-chip-retailer">
                      {deal.retailer}
                    </span>
                    {deal.score && (
                      <span className="pill-chip-score">
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
                    <span className="pill-name">{deal.name}</span>
                    <span className="pill-price">{deal.price}</span>
                    {deal.save && (
                      <span className="pill-chip-cut">
                        Save {deal.save}
                      </span>
                    )}
                    <span className="pill-chip-retailer">
                      {deal.retailer}
                    </span>
                    {deal.score && (
                      <span className="pill-chip-score">
                        Score {deal.score}
                      </span>
                    )}
                  </div>
                ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Interactive Workbench Section ─────────────────────────────── */}
      <section id="workbench" aria-labelledby="workbench-heading" className="workbench-section">
        
        <div className="workbench-header-row">
          <div className="workbench-title-col">
            <span className="workbench-kicker">Component Workbench</span>
            <h2 id="workbench-heading" className="workbench-title">
              Live Multi-Retailer Pricing Engine
            </h2>
          </div>
          
          <div role="tablist" aria-label="Demo Views" className="workbench-tabs">
            <button
              role="tab"
              aria-selected={demoTab === 'comparison'}
              onClick={() => setDemoTab('comparison')}
              className={`tab-btn ${demoTab === 'comparison' ? 'tab-btn-active' : ''}`}
            >
              Spread Comparison
            </button>
            <button
              role="tab"
              aria-selected={demoTab === 'digest'}
              onClick={() => setDemoTab('digest')}
              className={`tab-btn ${demoTab === 'digest' ? 'tab-btn-active' : ''}`}
            >
              Scheduled Briefing
            </button>
          </div>
        </div>

        {demoTab === 'comparison' ? (
          <div className="workbench-box">
            
            <div className="workbench-item-header">
              <div>
                <div className="item-title-row">
                  <span className="item-title">{featuredComparison.name}</span>
                  <span className="category-pill">{featuredComparison.category}</span>
                </div>
                <div className="item-score-info">
                  AI Deal Score:{' '}
                  <span className="score-val">{featuredComparison.score}/100</span>
                  {' '}• {featuredComparison.dealTag}
                </div>
              </div>

              <div className="price-summary-col">
                <div className="price-summary-label">Lowest Monitored Price</div>
                <div className="price-summary-value">{featuredComparison.lowestPrice}</div>
                <div className="price-summary-msrp">MSRP: {featuredComparison.msrp}</div>
              </div>
            </div>

            <div className="retailers-grid">
              {featuredComparison.retailers.map((r: any) => (
                <button
                  key={r.name}
                  onClick={() => setSelectedRetailer(r.name)}
                  className={`retailer-tile ${selectedRetailer === r.name ? 'retailer-tile-active' : ''}`}
                >
                  <div className="retailer-tile-header">
                    <span className="retailer-tile-name">{r.name}</span>
                    {r.isLowest && (
                      <span className="tile-tag-lowest">LOWEST</span>
                    )}
                    {r.status === 'testing' && (
                      <span className="tile-tag-testing">TESTING</span>
                    )}
                    {r.status === 'soon' && (
                      <span className="tile-tag-soon">SOON</span>
                    )}
                  </div>
                  <div className="retailer-tile-price">{r.price}</div>
                  <div className="retailer-tile-stock">{r.stock}</div>
                </button>
              ))}
            </div>

            <div className="workbench-footer">
              <span className="selected-retailer-info">Selected Retailer: <strong>{selectedRetailer}</strong></span>
              <Link href="/dashboard" className="track-btn">
                <span>Track in Dashboard</span>
                <ArrowRight className="track-btn-icon" aria-hidden="true" />
              </Link>
            </div>

          </div>
        ) : (
          <div className="workbench-box">
            
            <div className="digest-preview-header">
              <div>
                <span className="item-title">Automated Morning Briefing Preview (08:00 UTC)</span>
                <div className="item-score-info">
                  Delivered automatically when tracked items drop below target thresholds.
                </div>
              </div>

              <div className="digest-channel-toggle">
                <button
                  onClick={() => setDigestChannel('discord')}
                  className={`tab-btn ${digestChannel === 'discord' ? 'tab-btn-active' : ''}`}
                >
                  Discord Embed
                </button>
                <button
                  onClick={() => setDigestChannel('email')}
                  className={`tab-btn ${digestChannel === 'email' ? 'tab-btn-active' : ''}`}
                >
                  Email Briefing
                </button>
              </div>
            </div>

            <div className="digest-console">
              <div className="console-header">
                [RIGSCOUTER-DISPATCH] Daily Price Drop Digest • 2 Deals Triggered
              </div>
              <div className="console-channel">
                Channel: {digestChannel === 'discord' ? 'Discord Webhook (#rig-alerts)' : 'Verified Email Delivery'}
              </div>
              <div className="console-items-list">
                <div className="console-item">
                  • <span className="item-name-bold">ASUS TUF Gaming X870-PLUS WiFi AM5</span>: <span className="item-price-emerald">$149.00</span> on Amazon (35% under MSRP, Score: 99/100)
                </div>
                <div className="console-item">
                  • <span className="item-name-bold">Ryzen 7 9800X3D Desktop Processor</span>: <span className="item-price-emerald">$369.99</span> on eBay (Save $110, Score: 98/100)
                </div>
              </div>
            </div>

            <div className="digest-footer-action">
              <Link href="/dashboard" className="hero-primary-btn">
                <span>Configure Alert Preferences</span>
                <ArrowRight className="btn-icon" aria-hidden="true" />
              </Link>
            </div>

          </div>
        )}

      </section>

      {/* ── System Architecture & Ingestion Pipeline ──────────────────── */}
      <section id="architecture" aria-labelledby="arch-heading" className="architecture-section">
        <div className="architecture-header">
          <span className="workbench-kicker">Under the Hood</span>
          <h2 id="arch-heading" className="workbench-title">
            Architecture &amp; Reliability Pipeline
          </h2>
          <p className="architecture-lead">
            Continuous ingestion, statistical deal classification, and multi-tier scraping resilience designed to handle real-world inventory swings.
          </p>
        </div>

        <div className="features-grid">
          
          <article className="feature-card">
            <div className="feature-icon-box feature-icon-cyan">
              <Globe className="feature-icon-svg" aria-hidden="true" />
            </div>
            <h3 className="feature-title">Multi-Retailer Scraping</h3>
            <p className="feature-text">
              Real-time monitoring across Amazon and eBay with 2-cycle grace periods for temporary rate-limiting, out-of-stock validation, and automatic stock failover hot-swapping.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon-box feature-icon-purple">
              <BarChart3 className="feature-icon-svg" aria-hidden="true" />
            </div>
            <h3 className="feature-title">AI Deal Scoring (0–100)</h3>
            <p className="feature-text">
              Statistical discount evaluation comparing listings against rolling 90-day historic all-time lows (45%), manufacturer MSRP (35%), and cross-retailer pricing spread (20%).
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon-box feature-icon-emerald">
              <Mail className="feature-icon-svg" aria-hidden="true" />
            </div>
            <h3 className="feature-title">Automated Daily Digest</h3>
            <p className="feature-text">
              Automated briefing engine executing daily at 08:00 UTC, summarizing newly triggered price drops and dispatching formatted payloads to Discord webhooks and email.
            </p>
          </article>

        </div>

        {/* Multi-Tier Execution Pipeline */}
        <div className="pipeline-block">
          <div className="pipeline-subheading">
            Failover Ingestion Pipeline
          </div>

          <div className="pipeline-grid">
            <div className="pipeline-card">
              <div className="pipeline-card-header">
                <span className="pipeline-badge-tier1">TIER 1</span>
                <span className="pipeline-card-title">Direct OAuth 2.0 REST API</span>
              </div>
              <p className="pipeline-card-desc">
                Official eBay Browse API integration utilizing client credentials for real-time inventory queries and verified condition parsing.
              </p>
            </div>

            <div className="pipeline-card">
              <div className="pipeline-card-header">
                <span className="pipeline-badge-tier2">TIER 2</span>
                <span className="pipeline-card-title">TLS Fingerprint Impersonation</span>
              </div>
              <p className="pipeline-card-desc">
                Automated curl-impersonate client matching browser JA3/JA4 TLS signatures and HTTP/2 framing to bypass bot mitigations.
              </p>
            </div>

            <div className="pipeline-card">
              <div className="pipeline-card-header">
                <span className="pipeline-badge-tier3">TIER 3</span>
                <span className="pipeline-card-title">All Offers Display (AOD) Extraction</span>
              </div>
              <p className="pipeline-card-desc">
                Specialized extraction verifying Brand New Buy Box pricing over open-box, renewed, or third-party seller variations.
              </p>
            </div>

            <div className="pipeline-card">
              <div className="pipeline-card-header">
                <span className="pipeline-badge-tier4">TIER 4</span>
                <span className="pipeline-card-title">Real-Time Search AI Fallback</span>
              </div>
              <p className="pipeline-card-desc">
                Fallback scraper with exact-match model verification ensuring alerts only trigger on authentic product listings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deal Scoring Mechanics & Algorithmic Indexing ──────────────── */}
      <section id="methodology" aria-labelledby="methodology-heading" className="methodology-section">
        <div className="architecture-header">
          <span className="workbench-kicker">Mathematical Formulation</span>
          <h2 id="methodology-heading" className="workbench-title">
            Deal Scoring Mechanics &amp; Multi-Factor Weights
          </h2>
          <p className="architecture-lead">
            Every tracked hardware SKU receives an automated composite Deal Score (0–100) calibrated against historical median trajectories, manufacturer baselines, and seller fulfillment tier.
          </p>
        </div>

        <div className="methodology-grid">
          <article className="methodology-card">
            <span className="methodology-card-weight">40% Weight</span>
            <h3 className="methodology-card-title">Historical Baseline Delta</h3>
            <p className="methodology-card-desc">
              Measures the instantaneous drop relative to the rolling 90-day moving median price. Rewards authentic all-time lows while filtering out fake markdowns.
            </p>
            <div className="formula-box">
              ΔHist = (P90d - Pcurr) / P90d
            </div>
          </article>

          <article className="methodology-card">
            <span className="methodology-card-weight">35% Weight</span>
            <h3 className="methodology-card-title">MSRP Baseline Delta</h3>
            <p className="methodology-card-desc">
              Compares current offer against official manufacturer suggested retail prices from AMD, Intel, NVIDIA, and board partners to catch true generational liquidations.
            </p>
            <div className="formula-box">
              ΔMSRP = (Pmsrp - Pcurr) / Pmsrp
            </div>
          </article>

          <article className="methodology-card">
            <span className="methodology-card-weight">15% Weight</span>
            <h3 className="methodology-card-title">Cross-Retailer Spread</h3>
            <p className="methodology-card-desc">
              Calculates the divergence between the lowest active listing and concurrent competitor offers across Amazon, eBay, Best Buy, and Micro Center.
            </p>
            <div className="formula-box">
              ΔSpread = (Pcomp - Pcurr) / Pcomp
            </div>
          </article>

          <article className="methodology-card">
            <span className="methodology-card-weight">10% Weight</span>
            <h3 className="methodology-card-title">Merchant Credibility</h3>
            <p className="methodology-card-desc">
              Scores seller authenticity: direct factory fulfillment (Amazon Ships/Sells, eBay Top Rated Plus) earns full weight; unknown marketplace merchants receive strict damping.
            </p>
            <div className="formula-box">
              Sauth ∈ [0.4, 1.0] Multiplier
            </div>
          </article>
        </div>
      </section>

      {/* ── Top Deals Data Table ───────────────────────────────────────── */}
      <section id="deals" aria-labelledby="deals-heading" className="deals-section">
        
        <div className="deals-header-row">
          <div>
            <span className="deals-kicker">Live Database Feed</span>
            <h2 id="deals-heading" className="deals-title">
              Top Hardware Deals
            </h2>
          </div>
          <Link href="/dashboard" className="deals-more-link">
            <span>Explore All Watchlist Items</span>
            <ArrowRight className="deals-more-icon" aria-hidden="true" />
          </Link>
        </div>

        <div className="deals-table-wrapper">
          <table className="deals-table">
            <caption className="sr-only">Curated Top Real-Time Desktop PC Component Deals across Monitored Retailers</caption>
            <thead className="deals-thead">
              <tr className="deals-tr">
                <th scope="col" className="deals-th">Hardware Component</th>
                <th scope="col" className="deals-th">Category</th>
                <th scope="col" className="deals-th">Best Price</th>
                <th scope="col" className="deals-th">Retailer</th>
                <th scope="col" className="deals-th">AI Score</th>
                <th scope="col" className="deals-th deals-th-action">Action</th>
              </tr>
            </thead>
            <tbody className="deals-tbody">
              {topDeals.map((deal) => (
                <tr key={deal.id} className="deals-tr">
                  <td className="deals-td deals-td-name">
                    {deal.name}
                  </td>
                  <td className="deals-td deals-td-category">
                    <span className="category-pill">{deal.category}</span>
                  </td>
                  <td className="deals-td deals-td-price">
                    ${typeof deal.price === 'number' ? deal.price.toFixed(2) : deal.price}
                    {deal.cut && (
                      <span className="price-cut-tag">{deal.cut}</span>
                    )}
                  </td>
                  <td className="deals-td deals-td-retailer">
                    {deal.retailer}
                  </td>
                  <td className="deals-td deals-td-score">
                    <span className="pill-chip-score">
                      {deal.score}/100
                    </span>
                  </td>
                  <td className="deals-td deals-td-action">
                    <Link
                      href="/dashboard"
                      className="deal-track-btn"
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

      {/* ── Multi-Retailer Ingestion Specifications Matrix ─────────────── */}
      <section id="ingestion-specs" aria-labelledby="specs-heading" className="specs-section">
        <div className="architecture-header">
          <span className="workbench-kicker">Data Pipeline Standards</span>
          <h2 id="specs-heading" className="workbench-title">
            Retailer Ingestion Matrix &amp; Synchronization Cadence
          </h2>
          <p className="architecture-lead">
            Transparent breakdown of our multi-retailer crawler protocols, refresh intervals, rate-limit resilience strategies, and stock verification standards.
          </p>
        </div>

        <div className="specs-table-wrapper">
          <table className="specs-table">
            <caption className="sr-only">Detailed Retailer Polling Cadence and API Protocols</caption>
            <thead className="specs-thead">
              <tr className="specs-tr">
                <th scope="col" className="specs-th">Retailer Endpoint</th>
                <th scope="col" className="specs-th">Polling Cadence</th>
                <th scope="col" className="specs-th">Integration Tier</th>
                <th scope="col" className="specs-th">Stock Validation Protocol</th>
                <th scope="col" className="specs-th">Status</th>
              </tr>
            </thead>
            <tbody className="specs-tbody">
              <tr className="specs-tr">
                <td className="specs-td specs-td-strong">Amazon US</td>
                <td className="specs-td">Every 15 Minutes</td>
                <td className="specs-td">AOD + Headless TLS Parsing</td>
                <td className="specs-td">Buy-Box Verification &amp; Prime Stock Check</td>
                <td className="specs-td"><span className="specs-badge-live">ACTIVE</span></td>
              </tr>
              <tr className="specs-tr">
                <td className="specs-td specs-td-strong">eBay Electronics</td>
                <td className="specs-td">Every 15 Minutes</td>
                <td className="specs-td">OAuth 2.0 Browse REST API</td>
                <td className="specs-td">Condition Enum 1000 (Brand New Sealed Only)</td>
                <td className="specs-td"><span className="specs-badge-live">ACTIVE</span></td>
              </tr>
              <tr className="specs-tr">
                <td className="specs-td specs-td-strong">Best Buy</td>
                <td className="specs-td">Every 30 Minutes</td>
                <td className="specs-td">Store Pickup &amp; Online API</td>
                <td className="specs-td">SKU Status &amp; Regional Distribution Validation</td>
                <td className="specs-td"><span className="specs-badge-queue">VALIDATING</span></td>
              </tr>
              <tr className="specs-tr">
                <td className="specs-td specs-td-strong">Micro Center</td>
                <td className="specs-td">Every 60 Minutes</td>
                <td className="specs-td">In-Store Inventory Feed</td>
                <td className="specs-td">Local Store Stock Allocation Counter</td>
                <td className="specs-td"><span className="specs-badge-queue">PIPELINE</span></td>
              </tr>
              <tr className="specs-tr">
                <td className="specs-td specs-td-strong">Newegg US</td>
                <td className="specs-td">Every 30 Minutes</td>
                <td className="specs-td">Direct Merchant Feed</td>
                <td className="specs-td">Shipped by Newegg Verification</td>
                <td className="specs-td"><span className="specs-badge-queue">PIPELINE</span></td>
              </tr>
              <tr className="specs-tr">
                <td className="specs-td specs-td-strong">B&amp;H Photo Video</td>
                <td className="specs-td">Every 60 Minutes</td>
                <td className="specs-td">Catalog Availability API</td>
                <td className="specs-td">Direct Authorized Dealer Warehouse Stock</td>
                <td className="specs-td"><span className="specs-badge-queue">PIPELINE</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Ecosystem Status Strip ────────────────────────────────────── */}
      <section id="ecosystem" aria-labelledby="ecosystem-heading" className="ecosystem-section">
        <div className="ecosystem-header-row">
          <h2 id="ecosystem-heading" className="ecosystem-title">
            Retailer Endpoint Status
          </h2>
          <p className="ecosystem-lead">
            Current operational state across monitored hardware vendors.
          </p>
        </div>

        <ul role="list" className="ecosystem-grid">
          <li role="listitem" className="ecosystem-card">
            <span className="ecosystem-vendor">Amazon</span>
            <span className="ecosystem-status-active">
              <span className="status-dot-active" aria-hidden="true" />
              <span>LIVE</span>
            </span>
          </li>
          <li role="listitem" className="ecosystem-card">
            <span className="ecosystem-vendor">eBay</span>
            <span className="ecosystem-status-active">
              <span className="status-dot-active" aria-hidden="true" />
              <span>LIVE</span>
            </span>
          </li>
          <li role="listitem" className="ecosystem-card">
            <span className="ecosystem-vendor">Best Buy</span>
            <span className="ecosystem-status-testing">
              <span className="status-dot-testing" aria-hidden="true" />
              <span>TESTING</span>
            </span>
          </li>
          <li role="listitem" className="ecosystem-card">
            <span className="ecosystem-vendor">Micro Center</span>
            <span className="ecosystem-status-soon">
              <span className="status-dot-soon" aria-hidden="true" />
              <span>SOON</span>
            </span>
          </li>
          <li role="listitem" className="ecosystem-card">
            <span className="ecosystem-vendor">Newegg</span>
            <span className="ecosystem-status-soon">
              <span className="status-dot-soon" aria-hidden="true" />
              <span>SOON</span>
            </span>
          </li>
          <li role="listitem" className="ecosystem-card">
            <span className="ecosystem-vendor">B&amp;H Photo</span>
            <span className="ecosystem-status-soon">
              <span className="status-dot-soon" aria-hidden="true" />
              <span>SOON</span>
            </span>
          </li>
        </ul>
      </section>

      {/* ── Hardware Market Intelligence Glossary ──────────────────────── */}
      <section id="hardware-glossary" aria-labelledby="glossary-heading" className="glossary-section">
        <div className="architecture-header">
          <span className="workbench-kicker">Reference Guide</span>
          <h2 id="glossary-heading" className="workbench-title">
            Hardware Price Intelligence Glossary
          </h2>
          <p className="architecture-lead">
            Standardized technical terminology utilized in RigScouter deal evaluations, statistical calibrations, and daily dispatch briefings.
          </p>
        </div>

        <dl className="glossary-dl">
          <div className="glossary-item">
            <dt className="glossary-dt">All-Time Low (ATL)</dt>
            <dd className="glossary-dd">
              The absolute lowest verified price recorded across authorized retailers within our continuous 90-day tracking window, strictly filtering out unverified marketplace third-party outliers and refurbished variants.
            </dd>
          </div>

          <div className="glossary-item">
            <dt className="glossary-dt">Manufacturer's Suggested Retail Price (MSRP)</dt>
            <dd className="glossary-dd">
              The benchmark baseline list price established by the hardware manufacturer (AMD, Intel, NVIDIA, ASUS, GIGABYTE, MSI) upon product launch, utilized as a defensive ceiling against artificially inflated discounts.
            </dd>
          </div>

          <div className="glossary-item">
            <dt className="glossary-dt">Minimum Advertised Price (MAP)</dt>
            <dd className="glossary-dd">
              Contractual baseline agreements enforced by hardware manufacturers forbidding retailers from advertising products below specified price points, often discovered exclusively via in-cart or direct checkout scraping.
            </dd>
          </div>

          <div className="glossary-item">
            <dt className="glossary-dt">Retailer Spread Variance (RSV)</dt>
            <dd className="glossary-dd">
              The percentage divergence between the minimum and maximum in-stock retail prices currently available for the identical SKU across Amazon, eBay, Best Buy, and Micro Center.
            </dd>
          </div>

          <div className="glossary-item">
            <dt className="glossary-dt">Buy-Box Verification</dt>
            <dd className="glossary-dd">
              An extraction validation protocol that checks the primary featured seller on marketplace platforms (Amazon Ships from/Sold by Amazon or eBay Top-Rated Plus) to protect users from secondary grey-market listings.
            </dd>
          </div>

          <div className="glossary-item">
            <dt className="glossary-dt">Rolling 90-Day Moving Median</dt>
            <dd className="glossary-dd">
              A robust non-parametric statistical measure that calculates true market price trends without skew from brief flash sales or sudden single-day artificial markups preceding promotional events.
            </dd>
          </div>

          <div className="glossary-item">
            <dt className="glossary-dt">Grace-Period Stock Failover</dt>
            <dd className="glossary-dd">
              A 2-cycle validation system that retains historical price tracking records during transient retailer 429 rate-limiting or brief 5-minute stock inventory fluctuations before declaring a component out-of-stock.
            </dd>
          </div>

          <div className="glossary-item">
            <dt className="glossary-dt">Automated Morning Dispatch</dt>
            <dd className="glossary-dd">
              A daily background batch execution running at 08:00 UTC that aggregates all active watchlist price drops satisfying user alert thresholds and delivers structured embeds to Discord webhooks and verified emails.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Bottom CTA Banner ──────────────────────────────────────────── */}
      <section id="cta" aria-labelledby="cta-heading" className="cta-section">
        <div className="cta-box">
          <h2 id="cta-heading" className="cta-title">
            Automate Your Hardware Price Tracking
          </h2>
          <p className="cta-lead">
            Launch the live dashboard to search desktop components, set target price alert thresholds, and receive automated briefings.
          </p>
          <div className="cta-btn-wrap">
            <Link
              href="/dashboard"
              className="cta-launch-btn"
            >
              <Bell className="cta-btn-icon" aria-hidden="true" />
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
              <Cpu className="footer-brand-icon" aria-hidden="true" />
              <span className="footer-brand-name">RigScouter-AI</span>
            </div>
            <div className="footer-copy">
              © 2026 RigScouter-AI • Autonomous PC Hardware Intelligence
            </div>
            <nav aria-label="Footer Navigation" className="footer-nav">
              <Link href="/dashboard" className="footer-nav-link">Dashboard</Link>
              <Link href="/features" className="footer-nav-link">Features</Link>
              <Link href="/deal-scoring" className="footer-nav-link">Deal Scoring</Link>
              <Link href="/methodology" className="footer-nav-link">Methodology</Link>
              <Link href="/privacy" className="footer-nav-link">Privacy</Link>
              <Link href="/terms" className="footer-nav-link">Terms</Link>
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
