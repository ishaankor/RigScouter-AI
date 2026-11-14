import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, ShieldCheck, Database, Layers, Zap, Activity } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scraping Architecture & Deal Scoring Methodology',
  description:
    'Technical deep-dive into RigScouter AI’s autonomous multi-retailer price crawler, 4-tier fallback resilience engine, and hardware compatibility validation algorithm.',
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f3f4f6]">
      {/* Top Header Navigation */}
      <header role="banner" className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f19]/80 border-b border-gray-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 text-xs font-semibold transition-all group"
            aria-label="Back to Homepage"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            <span>Back to Home</span>
          </Link>

          <Link href="/" className="flex items-center gap-2 group" aria-label="RigScouter Home">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Cpu className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <span className="text-base font-bold font-heading text-white">
              RigScouter<span className="text-cyan-400">-AI</span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="rs-btn-primary"
            aria-label="Open Live Dashboard"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      {/* Main Semantic Article */}
      <main id="main-content" role="main" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
        
        {/* Page Heading */}
        <section aria-labelledby="methodology-title" className="space-y-4 border-b border-gray-800 pb-8">
          <span className="rs-badge rs-badge-cyan">Architecture & Research</span>
          <h1 id="methodology-title" className="text-3xl sm:text-5xl font-black font-heading text-white tracking-tight">
            Price Intelligence & Verification Methodology
          </h1>
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-3xl">
            How RigScouter AI autonomously monitors desktop PC hardware markets across retailers, eliminates scraping false-positives, validates part compatibility, and calculates mathematical deal scores.
          </p>
        </section>

        {/* Pillar 1: 4-Tier Scraper Architecture */}
        <article className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">1. Four-Tier Scraper Fallback Engine</h2>
          </div>
          
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
            Modern e-commerce platforms actively deploy anti-bot defenses, dynamic JavaScript hydration, and buybox suppression algorithms. RigScouter overcomes single-point scraping failures by executing an asynchronous 4-tier sequential fallback pipeline:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rs-card p-5 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Tier 1 • Official REST APIs</span>
              <h3 className="text-base font-bold text-white">OAuth2 Application Protocol</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Queries verified developer APIs (such as eBay Browse API) with Bearer token authentication to fetch structured availability, seller ratings, and real-time inventory counts.
              </p>
            </div>

            <div className="rs-card p-5 space-y-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tier 2 • TLS Fingerprint Mimicry</span>
              <h3 className="text-base font-bold text-white">JA3 / HTTP/2 Impersonation</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Utilizes curl-cffi with Chrome 124 TLS cipher suites and ALPN negotiation parameters to bypass Cloudflare and Akamai bot challenges on product landing pages.
              </p>
            </div>

            <div className="rs-card p-5 space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Tier 3 • Direct DOM Parsers</span>
              <h3 className="text-base font-bold text-white">Semantic Container Extraction</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Evaluates structured price containers (e.g. Amazon AOD buybox widgets, corePriceDisplay, and eBay binBtn anchors) while verifying explicit in-stock buybox buttons.
              </p>
            </div>

            <div className="rs-card p-5 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tier 4 • Search Discovery</span>
              <h3 className="text-base font-bold text-white">Autonomous Hot-Swapping</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                When a listing permanently ends, the crawler discovers replacement SKUs from the same retailer, verifies component identity, and hot-swaps the tracking target.
              </p>
            </div>
          </div>
        </article>

        {/* Pillar 2: Hardware Compatibility Engine */}
        <article className="space-y-6 border-t border-gray-800/80 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">2. Strict Hardware Compatibility Engine</h2>
          </div>
          
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
            A common failure mode of automated scrapers is accessory or sub-tier hijacking—for example, treating a water block or backplate as a graphics card, or mistaking an RTX 5070 for an RTX 5070 Ti. RigScouter runs every offer candidate through strict deterministic heuristic filters:
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl space-y-1">
              <dt className="font-bold text-white">GPU Tier Isolation</dt>
              <dd className="text-gray-400">Enforces mutual exclusivity between base and Ti/Super variants (e.g., RTX 4070 vs 4070 Super).</dd>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl space-y-1">
              <dt className="font-bold text-white">Motherboard Chipset Matching</dt>
              <dd className="text-gray-400">Rejects chipset mismatches (e.g., B650E vs B650M) and cross-vendor brand hijacking.</dd>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl space-y-1">
              <dt className="font-bold text-white">CPU Suffix Enforcement</dt>
              <dd className="text-gray-400">Distinguishes gaming-critical suffixes including X3D, K, KF, X, XT, and GT processors.</dd>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl space-y-1">
              <dt className="font-bold text-white">Accessory Pruning</dt>
              <dd className="text-gray-400">Filters out cables, water blocks, shrouds, and boxes before they enter historical analytics.</dd>
            </div>
          </dl>
        </article>

        {/* Pillar 3: Deal Scoring */}
        <article className="space-y-6 border-t border-gray-800/80 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">3. Mathematical Deal Score (0–100)</h2>
          </div>
          
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
            Deals are evaluated on an objective 0–100 scale derived from real-time pricing against manufacturer MSRP, historical median, and rolling all-time low (ATL) benchmarks:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li><strong className="text-white">Score 90–99 (Exceptional Value)</strong>: Price is at or below the 90-day ATL and represents greater than a 25% discount relative to MSRP.</li>
            <li><strong className="text-white">Score 75–89 (Strong Deal)</strong>: Price has dropped by at least 10% below the 24-hour baseline or 15% below MSRP with confirmed seller stock.</li>
            <li><strong className="text-white">Score 50–74 (Fair Market Price)</strong>: Normal operational street price within standard historical variance.</li>
            <li><strong className="text-white">Score 0 (Sold Out / Stale)</strong>: Applied immediately when consecutive stock verification misses confirm listing exhaustion.</li>
          </ul>
        </article>

      </main>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-gray-800/80 bg-gray-950/80 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2 text-gray-300 font-bold">
            <Cpu className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>RigScouter-AI</span>
          </div>
          <div>
            © 2026 RigScouter-AI • Technical Documentation
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

