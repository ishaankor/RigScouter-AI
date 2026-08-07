'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/db/supabase';
import { AuthModal } from '@/components/AuthModal';
import {
  Cpu,
  Globe,
  Lock,
  Mail,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Bot,
  Flame,
  Search,
  Bell,
  Sliders,
  TrendingDown,
  LogIn,
  LogOut,
  ChevronRight,
  Database
} from 'lucide-react';

export default function FeaturesPage() {
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Top Header Navigation */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-heading tracking-tight gradient-text-blue">
              RigScouter<span className="text-white">-AI</span>
            </h1>
            <p className="text-xs text-gray-400">
              PC Hardware Scraper • RAG Build Engine • Automated Daily Price Digest
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <Link
            href="/"
            className="text-gray-300 hover:text-white font-bold px-3 py-2 rounded-xl hover:bg-gray-900 transition-colors"
          >
            ← Back to Home
          </Link>

          {user ? (
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[10px] text-gray-950">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <span className="text-gray-300 font-medium max-w-[140px] truncate">{user.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                title="Sign Out"
                className="ml-1 text-gray-400 hover:text-red-400 p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* Features Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
          <Sparkles className="w-4 h-4" /> Platform Capabilities & Architecture
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-white font-heading tracking-tight">
          Everything You Need to Track & Score PC Deals
        </h1>
        <p className="text-base text-gray-400 leading-relaxed">
          Explore the technology powering RigScouter-AI — from Firecrawl LLM extractions to Supabase Row Level Security and automated daily price digests.
        </p>
      </div>

      {/* Feature 1 Deep-Dive */}
      <section className="glass-card p-8 md:p-10 rounded-3xl border border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Feature #1</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white font-heading">
            Autonomous Multi-Retailer Web Scraper
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Powered by Firecrawl & Tavily APIs, RigScouter-AI renders dynamic JavaScript web pages natively in cloud browsers, bypassing anti-bot checks across Micro Center, Amazon, Newegg, Best Buy, and B&H Photo.
          </p>
          <ul className="space-y-2 text-xs text-gray-300 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Extracts structured JSON: current price, MSRP, retailer, product URL, and stock status.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Normalizes partner graphics cards (ASUS Dual, MSI Ventus) into canonical base models (e.g. RTX 4070 Super).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Rejects non-PC part queries with instantaneous "Not compatible (N/A)" validation.</span>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-5 bg-gray-900/80 p-6 rounded-2xl border border-gray-800 font-mono text-xs text-gray-300 space-y-3">
          <div className="text-[11px] text-cyan-400 font-bold border-b border-gray-800 pb-2">
            // Firecrawl LLM Extraction Schema
          </div>
          <pre className="text-[11px] text-emerald-300 overflow-x-auto">
{`{
  "title": "ASUS Dual RTX 4070 Super 12GB",
  "currentPrice": 549.99,
  "originalPrice": 599.99,
  "retailer": "Micro Center",
  "inStock": true,
  "canonicalModel": "RTX 4070 Super",
  "dealScore": 92
}`}
          </pre>
        </div>
      </section>

      {/* Feature 2 Deep-Dive */}
      <section className="glass-card p-8 md:p-10 rounded-3xl border border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 bg-gray-900/80 p-6 rounded-2xl border border-gray-800 font-mono text-xs text-gray-300 space-y-3 order-2 lg:order-1">
          <div className="text-[11px] text-purple-400 font-bold border-b border-gray-800 pb-2 flex items-center justify-between">
            <span>// Supabase RLS Security Policy</span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <pre className="text-[11px] text-purple-300 overflow-x-auto">
{`CREATE POLICY "User Watchlist Isolation"
  ON watchlist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);`}
          </pre>
        </div>
        <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Feature #2</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white font-heading">
            Personalized Watchlist & RLS Security
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Your hardware target alert prices and component watchlists are protected using Supabase Row Level Security (RLS). Users must sign in to save items to their private watchlist.
          </p>
          <ul className="space-y-2 text-xs text-gray-300 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Email Sign-In & Registration via Supabase Auth.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Database-Direct Reads load your watchlist in ~20ms with 0 slow API requests on page load.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-table atomic writes save to watchlist_items, hardware_components, and user_preferences.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Feature 3 Deep-Dive */}
      <section className="glass-card p-8 md:p-10 rounded-3xl border border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Feature #3</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white font-heading">
            RAG AI Rig Concierge & Compatibility Checker
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Build custom PC configurations backed by an intelligent AI build agent. Automatically checks CPU sockets, motherboard form factors, RAM heights, GPU lengths, and power supply TDP headroom.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl transition-all"
            >
              <Bot className="w-4 h-4" /> Try AI Rig Concierge <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5 bg-gray-900/80 p-6 rounded-2xl border border-gray-800 space-y-3 text-xs">
          <div className="font-bold text-white border-b border-gray-800 pb-2">
            🤖 AI Verified PC Parts List
          </div>
          <div className="space-y-2 text-gray-300 font-mono text-[11px]">
            <div className="flex justify-between"><span>CPU:</span><span className="text-white font-bold">AMD Ryzen 7 7800X3D</span></div>
            <div className="flex justify-between"><span>GPU:</span><span className="text-white font-bold">RTX 4070 Super 12GB</span></div>
            <div className="flex justify-between"><span>RAM:</span><span className="text-white font-bold">DDR5-6000 32GB CL30</span></div>
            <div className="flex justify-between"><span>TDP Headroom:</span><span className="text-emerald-400 font-bold">+180W Safe</span></div>
          </div>
        </div>
      </section>

      {/* Feature 4 Deep-Dive */}
      <section className="glass-card p-8 md:p-10 rounded-3xl border border-gray-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 bg-gray-900/80 p-6 rounded-2xl border border-gray-800 space-y-3 text-xs order-2 lg:order-1">
          <div className="font-bold text-amber-400 border-b border-gray-800 pb-2">
            📬 Scheduled Digest Dispatch
          </div>
          <div className="space-y-2 text-gray-300 text-[11px]">
            <div className="flex justify-between"><span>Schedule:</span><span className="text-white font-mono font-bold">Daily @ 08:00 AM UTC</span></div>
            <div className="flex justify-between"><span>Channels:</span><span className="text-cyan-400 font-bold">Email & Discord</span></div>
            <div className="flex justify-between"><span>Trend Interval:</span><span className="text-purple-400 font-bold">24h / 7d / 30d / ATL</span></div>
          </div>
        </div>
        <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Mail className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Feature #4</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white font-heading">
            Automated Daily Price Digest & Cron Job
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Subscribed users receive automated daily digests delivered straight to their Email inbox or Discord channel. Includes executive price drop summaries, historical trend deltas, and AI deal scores.
          </p>
        </div>
      </section>

      {/* CTA Footer Section */}
      <div className="glass-card p-8 rounded-3xl border border-gray-800 text-center space-y-4">
        <h3 className="text-2xl font-bold text-white font-heading">Ready to Track PC Deals Autonomously?</h3>
        <p className="text-xs text-gray-400 max-w-xl mx-auto">
          Sign in or launch the watchlist to start scoring hardware deals across Micro Center, Amazon, and Newegg.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/"
            className="btn-glow px-6 py-3 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xl"
          >
            <Bell className="w-4 h-4" /> Go to Main Dashboard
          </Link>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </main>
  );
}
