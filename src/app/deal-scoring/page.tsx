import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Cpu, ShieldCheck, BarChart3, Database, Sparkles, Scale, Percent, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Deal Scoring Methodology & Algorithm',
  description: 'Technical specification of the RigScouter AI Multi-Factor Hardware Deal Scoring algorithm (0–100), evaluating MSRP variance, rolling 90-day all-time lows, and cross-retailer competition.',
  alternates: {
    canonical: 'https://rigscouter.ai/deal-scoring',
  },
  openGraph: {
    title: 'Deal Scoring Methodology & Algorithm | RigScouter AI',
    description: 'How RigScouter cuts through deceptive retail discounts with automated multi-retailer variance analytics.',
    url: 'https://rigscouter.ai/deal-scoring',
  },
};

export default function DealScoringPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <header role="banner" className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f19]/80 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 text-xs font-semibold transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Home</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="font-heading font-black text-white text-base">RigScouter-AI</span>
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="btn-glow px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            Launch Dashboard
          </Link>
        </div>
      </header>

      <main id="main-content" role="main" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <header className="space-y-4 text-center">
          <span className="section-kicker">Algorithmic Specification</span>
          <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white">
            AI Deal Scoring Engine (0–100)
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            How RigScouter cuts through artificial discount markups, vendor rebates, and inflated list prices to provide true mathematical price intelligence.
          </p>
        </header>

        {/* Section 1: The Problem with Traditional Discounts */}
        <section aria-labelledby="problem-heading" className="rs-card p-6 sm:p-8 space-y-4">
          <h2 id="problem-heading" className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <span>The Retailer Discount Fallacy</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Major electronics retailers routinely inflate baseline MSRP before holiday events or flash sales, advertising "30% OFF!" on listings that are actually priced higher than their 30-day average. A consumer relying solely on vendor strikethrough badges consistently overpays.
          </p>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            RigScouter operates as an adversarial validator. Every scraped offer is stripped of marketing metadata and cross-referenced against continuous historical snapshots across competing retailers.
          </p>
        </section>

        {/* Section 2: Mathematical Formula Breakdown */}
        <section aria-labelledby="formula-heading" className="rs-card p-6 sm:p-8 space-y-6">
          <h2 id="formula-heading" className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Percent className="w-5 h-5 text-emerald-400" />
            <span>Weighted Scoring Weights & Parameters</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <article className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400">45% Weight</span>
              <h3 className="text-sm font-bold text-white">90-Day All-Time Low</h3>
              <p className="text-xs text-gray-400">
                Measures current price relative to the verified 90-day minimum across all monitored stores.
              </p>
            </article>

            <article className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
              <span className="text-xs font-bold text-purple-400">35% Weight</span>
              <h3 className="text-sm font-bold text-white">True Manufacturer MSRP</h3>
              <p className="text-xs text-gray-400">
                Hardware launch reference price anchored directly from silicon vendor technical specifications.
              </p>
            </article>

            <article className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400">20% Weight</span>
              <h3 className="text-sm font-bold text-white">Multi-Store Spread</h3>
              <p className="text-xs text-gray-400">
                Arbitrage spread comparing active in-stock listings on Amazon, eBay, Best Buy, and Micro Center.
              </p>
            </article>
          </div>
        </section>

        {/* Section 3: Score Interpretation Matrix */}
        <section aria-labelledby="tiers-heading" className="rs-card p-6 sm:p-8 space-y-4">
          <h2 id="tiers-heading" className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span>Deal Score Interpretation Matrix</span>
          </h2>
          
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
              <dt className="font-bold text-cyan-300 text-sm">95 – 100: Historic Flash Low</dt>
              <dd className="text-gray-400 mt-1">
                At or below the 90-day all-time record low with verified in-stock availability. Immediate buy recommendation.
              </dd>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <dt className="font-bold text-emerald-300 text-sm">85 – 94: Excellent Buy</dt>
              <dd className="text-gray-400 mt-1">
                Substantially discounted below MSRP and within 3% of all-time low. Outperforms competing retailers.
              </dd>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800">
              <dt className="font-bold text-gray-300 text-sm">70 – 84: Fair Market Deal</dt>
              <dd className="text-gray-400 mt-1">
                Standard competitive pricing. Reasonable buy if building immediately, but unlikely to be a limited flash drop.
              </dd>
            </div>
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <dt className="font-bold text-rose-300 text-sm">Below 70: Inflated / Overpriced</dt>
              <dd className="text-gray-400 mt-1">
                Above average market price or artificially marked up. High risk of price decline in upcoming cycle.
              </dd>
            </div>
          </dl>
        </section>
      </main>

      <footer role="contentinfo" className="border-t border-gray-800/80 bg-gray-950/80 py-8 text-center text-xs text-gray-500">
        <p>© 2026 RigScouter-AI • Autonomous PC Hardware Deal Intelligence</p>
      </footer>
    </div>
  );
}
