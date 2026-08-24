'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HardwareComponent } from '@/lib/types/hardware';
import { Flame, ExternalLink, RefreshCw, Radio, Zap, TrendingDown, Wifi, WifiOff } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface LivePriceDrop {
  query: string;
  retailer: string;
  previousPrice: number;
  newPrice: number;
  savings: string;
  url: string;
  title: string;
  category: string;
  timestamp: string;
}

export function DealRadar() {
  const [deals, setDeals] = useState<HardwareComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sseStatus, setSseStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [liveDrops, setLiveDrops] = useState<LivePriceDrop[]>([]);
  const [flashedIds, setFlashedIds] = useState<Set<string>>(new Set());
  const [currentlyScraping, setCurrentlyScraping] = useState<string | null>(null);
  const [connectedClients, setConnectedClients] = useState<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Load initial deals from backend DB ────────────────────────────────────
  const loadDeals = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/components`);
      if (res.ok) {
        const data = await res.json();
        if (data.components && data.components.length > 0) {
          setDeals(data.components.filter((c: HardwareComponent) => c.dealScore >= 80));
        }
      }
    } catch (e) {
      console.warn('[DealRadar] Failed to load initial DB deals:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Refresh deals list from DB ─────────────────────────────────────────────
  const refreshDeals = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/components`);
      if (res.ok) {
        const data = await res.json();
        if (data.components && data.components.length > 0) {
          setDeals(prev => {
            const incoming = data.components.filter((c: HardwareComponent) => c.dealScore >= 80);
            return incoming;
          });
        }
      }
    } catch (e) {}
  }, []);

  // ── SSE subscription ───────────────────────────────────────────────────────
  useEffect(() => {
    loadDeals();

    let retryTimer: ReturnType<typeof setTimeout>;
    let retryDelay = 2000;

    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setSseStatus('connecting');
      const es = new EventSource(`${BACKEND_URL}/api/stream`);
      eventSourceRef.current = es;

      es.addEventListener('connected', (e: MessageEvent) => {
        const payload = JSON.parse(e.data);
        setSseStatus('connected');
        setConnectedClients(1); // we're connected
        setLastUpdate(new Date().toLocaleTimeString());
        retryDelay = 2000; // reset backoff on success
        console.log('[DealRadar SSE] Connected:', payload.message);
      });

      es.addEventListener('scheduler_tick', (e: MessageEvent) => {
        const payload = JSON.parse(e.data);
        setCurrentlyScraping(payload.query);
        setLastUpdate(new Date().toLocaleTimeString());
      });

      es.addEventListener('retailer_found', (e: MessageEvent) => {
        const payload = JSON.parse(e.data);
        setLastUpdate(new Date().toLocaleTimeString());
        // Reload deals whenever a new retailer price lands
        refreshDeals();
      });

      es.addEventListener('price_drop', (e: MessageEvent) => {
        const drop: LivePriceDrop = JSON.parse(e.data);
        setLiveDrops(prev => [drop, ...prev].slice(0, 5));
        setLastUpdate(new Date().toLocaleTimeString());

        // Flash the updated card
        const flashKey = drop.query.toLowerCase().replace(/\s+/g, '-');
        setFlashedIds(prev => new Set(prev).add(flashKey));
        setTimeout(() => {
          setFlashedIds(prev => {
            const next = new Set(prev);
            next.delete(flashKey);
            return next;
          });
        }, 4000);

        refreshDeals();
      });

      es.addEventListener('agent_complete', (e: MessageEvent) => {
        const payload = JSON.parse(e.data);
        setCurrentlyScraping(null);
        setLastUpdate(new Date().toLocaleTimeString());
        if (payload.bestOffer) refreshDeals();
      });

      es.addEventListener('agent_error', () => {
        setCurrentlyScraping(null);
      });

      es.addEventListener('scheduler_error', () => {
        setCurrentlyScraping(null);
      });

      es.onerror = () => {
        setSseStatus('disconnected');
        setCurrentlyScraping(null);
        es.close();
        eventSourceRef.current = null;
        // Exponential backoff reconnect
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, 30000);
          connect();
        }, retryDelay);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      eventSourceRef.current?.close();
    };
  }, [loadDeals, refreshDeals]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    await refreshDeals();
    setIsLoading(false);
  };

  const triggerScrape = async (query: string) => {
    setCurrentlyScraping(query);
    try {
      await fetch(`${BACKEND_URL}/api/agent/run?query=${encodeURIComponent(query)}`);
    } catch {}
    // SSE events will handle updating the UI
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 border border-gray-800 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Flash Deals Radar
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Auto-refreshed every 15 min via Tavily + Gemini scraper. Prices pushed live via SSE.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* SSE Status Badge */}
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              sseStatus === 'connected'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : sseStatus === 'connecting'
                ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}>
              {sseStatus === 'connected'
                ? <><Wifi className="w-3.5 h-3.5" /><span>LIVE</span></>
                : sseStatus === 'connecting'
                ? <><Radio className="w-3.5 h-3.5 animate-pulse" /><span>CONNECTING</span></>
                : <><WifiOff className="w-3.5 h-3.5" /><span>OFFLINE</span></>
              }
            </div>

            <button
              id="deal-radar-refresh-btn"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 transition-all"
              title="Refresh deals"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800/80">
          {currentlyScraping && (
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Radio className="w-3 h-3 animate-pulse" />
              Scraping: <strong className="text-white">{currentlyScraping}</strong>
            </span>
          )}
          {lastUpdate && (
            <span>Last update: <strong className="text-gray-300">{lastUpdate}</strong></span>
          )}
          <span>{deals.length} deals in DB</span>
        </div>
      </div>

      {/* ── Live Price Drop Alerts ──────────────────────────────────────────── */}
      {liveDrops.length > 0 && (
        <div className="glass-card p-4 border border-emerald-500/20 rounded-2xl bg-emerald-500/5">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4" />
            Live Price Drops
          </h3>
          <div className="space-y-2">
            {liveDrops.map((drop, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-gray-900/60 rounded-lg px-3 py-2 border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className="text-white font-medium">{drop.title.substring(0, 50)}</span>
                  <span className="text-gray-400">@ {drop.retailer}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-gray-500 line-through">${drop.previousPrice.toFixed(2)}</span>
                  <span className="text-emerald-400 font-bold">${drop.newPrice.toFixed(2)}</span>
                  <span className="text-yellow-400 font-bold">-${drop.savings}</span>
                  <a href={drop.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Trigger Buttons ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {['RTX 4070 Super', 'RX 7800 XT', 'GTX 1080 Ti', 'Ryzen 7 7800X3D', 'Samsung 990 Pro 1TB'].map(part => (
          <button
            key={part}
            id={`trigger-${part.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => triggerScrape(part)}
            disabled={currentlyScraping === part}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800/80 hover:bg-cyan-500/10 border border-gray-700 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 transition-all disabled:opacity-50"
          >
            {currentlyScraping === part ? (
              <span className="flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" /> Scraping...</span>
            ) : (
              `+ Scrape ${part}`
            )}
          </button>
        ))}
      </div>

      {/* ── Deal Cards Grid ─────────────────────────────────────────────────── */}
      {isLoading && deals.length === 0 ? (
        <div className="glass-card p-12 border border-gray-800 rounded-2xl flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-gray-400 text-sm">Loading live deals from database...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="glass-card p-12 border border-gray-800 rounded-2xl text-center">
          <Flame className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No deals in database yet.</p>
          <p className="text-gray-500 text-xs mt-1">The scheduler will populate deals automatically, or use the buttons above to trigger a scrape.</p>
        </div>
      ) : (
        <div className="glass-card p-6 border border-gray-800 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((item: HardwareComponent) => {
              const discountPct = item.msrp > item.currentPrice
                ? Math.round(((item.msrp - item.currentPrice) / item.msrp) * 100)
                : 0;
              const cardKey = item.model?.toLowerCase().replace(/\s+/g, '-') || item.id;
              const isFlashing = flashedIds.has(cardKey);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isFlashing
                      ? 'bg-emerald-900/30 border-emerald-400/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-gray-900/60 hover:bg-gray-900/90 border-gray-800 hover:border-cyan-500/40'
                  }`}
                >
                  {isFlashing && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold mb-2">
                      <Zap className="w-3 h-3" /> PRICE DROP DETECTED
                    </div>
                  )}

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
                        {(item as any).updatedAt && (
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            Updated: {new Date((item as any).updatedAt).toLocaleTimeString()}
                          </div>
                        )}
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
      )}
    </div>
  );
}
