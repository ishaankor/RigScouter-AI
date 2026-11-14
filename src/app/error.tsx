'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application runtime error:', error);
  }, [error]);

  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen bg-[#0b0f19] text-[#f3f4f6] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6">
        <span className="text-2xl">⚠️</span>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2">Application Error</p>
      <h1 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-400 max-w-md text-sm mb-8">
        An unexpected error occurred while fetching live hardware market metrics. You can attempt to retry the request or return to the overview.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-gray-950 hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Go Home</span>
        </Link>
      </div>
    </main>
  );
}

