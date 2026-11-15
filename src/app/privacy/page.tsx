import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'RigScouter AI Privacy Policy explaining our data collection, local storage preferences, and zero-resale user telemetry guarantees.',
  alternates: {
    canonical: 'https://rigscouter.ai/privacy',
  },
};

export default function PrivacyPage() {
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
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Legal & Transparency</span>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white">Privacy Policy</h1>
          <p className="text-xs text-gray-400">Last updated: November 2026</p>
        </header>

        <section className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
          <h2 className="text-base font-bold text-white font-heading">1. Information We Collect</h2>
          <p>
            RigScouter AI only collects minimal information required to maintain your custom hardware watchlist and dispatch notifications (your email address, target alert price thresholds, and optional Discord Webhook URLs).
          </p>

          <h2 className="text-base font-bold text-white font-heading">2. Zero Third-Party Monetization</h2>
          <p>
            We do not sell, rent, or monetize your search queries, watchlist components, or browser telemetry to data brokers or advertising networks.
          </p>

          <h2 className="text-base font-bold text-white font-heading">3. Security & Storage</h2>
          <p>
            All authenticated user state is protected using Row Level Security (RLS) on PostgreSQL via Supabase. Passwords and credentials are cryptographically hashed and never stored in plaintext.
          </p>

          <h2 className="text-base font-bold text-white font-heading">4. Contact & Inquiries</h2>
          <p>
            For privacy inquiries or account data deletion requests, contact us at <code className="text-cyan-400 font-mono">support@rigscouter.ai</code>.
          </p>
        </section>
      </main>
    </div>
  );
}
