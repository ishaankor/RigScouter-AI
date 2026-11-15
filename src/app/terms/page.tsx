import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Scale, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'RigScouter AI Terms of Service governing automated price tracking, deal alerts, and informational market intelligence.',
  alternates: {
    canonical: 'https://rigscouter.ai/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100">
      <header role="banner" className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f19]/80 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="font-heading font-black text-white text-sm">RigScouter-AI</span>
        </div>
      </header>

      <main id="main-content" role="main" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <header className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Legal Agreements</span>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white">Terms of Service</h1>
          <p className="text-xs text-gray-400">Last updated: November 2026</p>
        </header>

        <section className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
          <h2 className="text-base font-bold text-white font-heading">1. Informational Service Only</h2>
          <p>
            RigScouter AI provides price intelligence, deal scores, and historical charts for informational purposes only. We are not a direct vendor or merchant of record for tracked hardware items.
          </p>

          <h2 className="text-base font-bold text-white font-heading">2. Retailer Pricing & Availability</h2>
          <p>
            Retail prices, discount codes, shipping fees, and inventory stock are set exclusively by third-party retailers (Amazon, eBay, Best Buy, Micro Center, Newegg, B&H Photo). RigScouter cannot guarantee that an item remains in stock or at a listed price after publication.
          </p>

          <h2 className="text-base font-bold text-white font-heading">3. Permitted Personal Use</h2>
          <p>
            Users are granted a personal, non-exclusive license to track custom hardware components and receive automated daily price briefings. Unsanctioned scraping or denial-of-service abuse against RigScouter APIs is prohibited.
          </p>
        </section>
      </main>
    </div>
  );
}
