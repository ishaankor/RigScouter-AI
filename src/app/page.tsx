'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WatchlistManager } from '../components/WatchlistManager';
import { RigBuilderChat } from '../components/RigBuilderChat';
import { DailyDigestPreview } from '../components/DailyDigestPreview';
import { DealRadar } from '../components/DealRadar';
import { AuthModal } from '../components/AuthModal';
import { supabase } from '../lib/db/supabase';
import {
  Cpu,
  Bell,
  Calendar,
  Flame,
  Sparkles,
  ShieldCheck,
  LogIn,
  LogOut,
  ArrowRight,
  Globe,
  Bot,
  Zap,
  CheckCircle2,
  Lock,
  Mail,
  Sliders,
  Award
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'digest'>('watchlist');
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Top User Auth & Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-gray-900/80 border border-gray-800 px-3 py-2 rounded-xl text-gray-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>RLS Security: <strong className="text-emerald-400">Active</strong></span>
          </div>

          {user ? (
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[10px] text-gray-950">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <span className="text-gray-300 font-medium max-w-[140px] truncate">{user.email}</span>
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
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs (Premium Segmented Control) */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-1 overflow-x-auto p-1.5 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800/60 shadow-inner">
          {[
            { id: 'watchlist', label: 'Watchlist Tracker', icon: Bell },
            { id: 'digest', label: 'Daily Digest', icon: Sparkles, isAI: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gray-800 text-white shadow-lg border border-gray-700/50'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 border border-transparent'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-100" />
                )}
                <Icon className={`w-4 h-4 z-10 ${tab.isAI && !isActive ? 'text-purple-400 opacity-70' : 'z-10'}`} />
                <span className="z-10">{tab.label}</span>
                {tab.isAI && (
                  <span className="z-10 ml-1.5 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] uppercase tracking-wider font-extrabold border border-purple-500/30">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Views */}
      <div className={activeTab === 'watchlist' ? 'block' : 'hidden'}>
        <WatchlistManager user={user} onOpenAuth={() => setAuthModalOpen(true)} />
      </div>
      <div className={activeTab === 'digest' ? 'block' : 'hidden'}>
        <DailyDigestPreview user={user} onOpenAuth={() => setAuthModalOpen(true)} />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />

      {/* Persistent Bottom Feature Banner */}
      <footer className="glass-card p-6 border border-gray-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Daily Automater Status:</strong> Active. Your configured price digest will be dispatched via Email / Discord at 08:00 AM UTC.
          </span>
        </div>
        <div className="text-gray-500 font-mono">
          RigScouter-AI v0.1.0 • Powered by Next.js & Supabase Auth (RLS Protected)
        </div>
      </footer>
    </main>
  );
}
