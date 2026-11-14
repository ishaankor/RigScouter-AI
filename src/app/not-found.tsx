import Link from 'next/link';
import { ArrowLeft, Cpu } from 'lucide-react';

export default function NotFound() {
  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen bg-[#0b0f19] text-[#f3f4f6] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-xl shadow-cyan-500/10">
        <Cpu className="w-8 h-8 text-cyan-400" />
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">404 Error</p>
      <h1 className="text-4xl sm:text-5xl font-black font-heading text-white tracking-tight mb-4">
        Component Not Found
      </h1>
      <p className="text-gray-400 max-w-md text-sm sm:text-base mb-8">
        The hardware page or resource you are looking for has been moved, unlisted, or does not exist in our catalog.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-gray-950 hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-all"
        >
          <span>Open Dashboard</span>
        </Link>
      </div>
    </main>
  );
}

