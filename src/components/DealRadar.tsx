'use client';

import React, { useState, useEffect } from 'react';
import { MOCK_HARDWARE_CATALOG } from '@/lib/scrapers/price-scraper';
import { HardwareComponent } from '@/lib/types/hardware';
import { Flame, ExternalLink, RefreshCw } from 'lucide-react';

export function DealRadar() {
  const [deals, setDeals] = useState<HardwareComponent[]>(
    MOCK_HARDWARE_CATALOG.filter((c: HardwareComponent) => c.dealScore >= 85)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadDbDeals() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/components');
        if (res.ok) {
          const data = await res.json();
          if (data.components && data.components.length > 0) {
            const highDeals = data.components.filter((c: HardwareComponent) => c.dealScore >= 80);
            if (highDeals.length > 0) {
              setDeals(highDeals);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load DB deals, using catalog fallback:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadDbDeals();
  }, []);

  return (
    <div className="glass-card p-6 border border-gray-800 rounded-2xl mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            Flash Sales & Database Hardware Deals
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real hardware items scraped via Tavily and saved in PostgreSQL database with Deal Scores above 80/100.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
          <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30 animate-pulse">
            LIVE DEALS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((item: HardwareComponent) => {
          const discountPct = Math.round(((item.msrp - item.currentPrice) / item.msrp) * 100);
          return (
            <div
              key={item.id}
              className="bg-gray-900/60 hover:bg-gray-900/90 p-4 rounded-xl border border-gray-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30">
                    {item.category}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
                    DEAL SCORE: {item.dealScore}/100
                  </span>
                </div>

                <div className="flex gap-3 mb-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover bg-gray-950 border border-gray-800 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2">{item.name}</h3>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <span>{item.retailer}</span>
                      {discountPct > 0 && (
                        <span className="text-emerald-400 font-bold">-{discountPct}% off MSRP</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-800 mt-2">
                <div>
                  <div className="text-lg font-bold text-white">${item.currentPrice.toFixed(2)}</div>
                  {item.msrp > item.currentPrice && (
                    <div className="text-xs text-gray-500 line-through">${item.msrp.toFixed(2)}</div>
                  )}
                </div>

                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glow px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  View Deal
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
