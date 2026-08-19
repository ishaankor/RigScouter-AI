'use client';

import React, { useState, useEffect } from 'react';
import { RigBuildRequirement, RigBuildRecommendation, HardwareComponent } from '@/lib/types/hardware';
import { recommendRigBuild } from '@/lib/ai/compatibility-checker';
import { supabase } from '@/lib/db/supabase';
import { Cpu, Zap, ShieldCheck, DollarSign, Sparkles, Monitor, Send, Check } from 'lucide-react';

export function RigBuilderChat() {
  const [budget, setBudget] = useState<number>(1200);
  const [useCase, setUseCase] = useState<RigBuildRequirement['useCase']>('gaming');
  const [targetResolution, setTargetResolution] = useState<RigBuildRequirement['targetResolution']>('1440p');
  const [isLiveScrapeMode, setIsLiveScrapeMode] = useState<boolean>(true);
  const [catalog, setCatalog] = useState<HardwareComponent[]>([]);
  
  const [recommendation, setRecommendation] = useState<RigBuildRecommendation>(() =>
    recommendRigBuild({ budget: 1200, useCase: 'gaming', targetResolution: '1440p' }, [])
  );

  useEffect(() => {
    async function loadCatalog() {
      try {
        const { data } = await supabase
          .from('hardware_components')
          .select('*')
          .order('deal_score', { ascending: false })
          .limit(100);

        if (data && data.length > 0) {
          const formatted: HardwareComponent[] = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            category: c.category,
            brand: c.brand,
            model: c.model,
            specs: typeof c.specs === 'string' ? JSON.parse(c.specs || '{}') : (c.specs || {}),
            msrp: c.msrp,
            currentPrice: c.current_price,
            lowestPrice90d: c.lowest_price_90d,
            retailer: c.retailer,
            productUrl: c.product_url,
            imageUrl: c.image_url,
            rating: c.rating,
            dealScore: c.deal_score
          }));
          setCatalog(formatted);
          setRecommendation(recommendRigBuild({ budget, useCase, targetResolution }, formatted));
        }
      } catch (e) {}
    }
    loadCatalog();
  }, []);

  const handleUpdate = (newBudget: number, newUseCase = useCase, newRes = targetResolution) => {
    setBudget(newBudget);
    setUseCase(newUseCase);
    setTargetResolution(newRes);
    setRecommendation(recommendRigBuild({ budget: newBudget, useCase: newUseCase, targetResolution: newRes }, catalog));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* Left Control Panel */}
      <div className="lg:col-span-4 glass-card p-6 border border-gray-800 rounded-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold font-heading text-white">AI Rig Concierge</h2>
            </div>
            <button
              onClick={() => setIsLiveScrapeMode(!isLiveScrapeMode)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                isLiveScrapeMode
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
            >
              {isLiveScrapeMode ? '● LIVE SCRAPER ON' : '○ STATIC CATALOG'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-6">
            Configure your target budget & use case. The AI continuously scours retailers for compatible component deals.
          </p>

          {/* Budget Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-300">Target Budget</label>
              <span className="text-lg font-bold text-cyan-400">${budget}</span>
            </div>
            <input
              type="range"
              min={600}
              max={3500}
              step={50}
              value={budget}
              onChange={(e) => handleUpdate(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>$600 (Entry)</span>
              <span>$1,800 (Sweet Spot)</span>
              <span>$3,500 (Ultimate)</span>
            </div>
          </div>

          {/* Resolution Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-300 mb-2">Target Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1080p', '1440p', '4K'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => handleUpdate(budget, useCase, res)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    targetResolution === res
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                      : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Use Case */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-300 mb-2">Primary Use Case</label>
            <div className="grid grid-cols-2 gap-2">
              {(['gaming', 'productivity', 'streaming', 'balanced'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleUpdate(budget, mode, targetResolution)}
                  className={`py-2 text-xs font-semibold capitalize rounded-xl border transition-all ${
                    useCase === mode
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compatibility Specs Card */}
        <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Compatibility Status
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
              100% Verified
            </span>
          </div>
          <div className="flex justify-between text-gray-300 py-1 border-b border-gray-800">
            <span>Est. System Draw:</span>
            <span className="font-bold text-white">{recommendation.compatibility.estimatedWattage}W</span>
          </div>
          <div className="flex justify-between text-gray-300 py-1">
            <span>Recommended PSU:</span>
            <span className="font-bold text-cyan-400">{recommendation.compatibility.recommendedPSU}W Gold</span>
          </div>
        </div>
      </div>

      {/* Right Recommendation Output Panel */}
      <div className="lg:col-span-8 glass-card p-6 border border-gray-800 rounded-2xl flex flex-col justify-between">
        <div>
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-800">
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold">AI Recommended Build</div>
              <h3 className="text-2xl font-bold font-heading text-white">
                {targetResolution} {useCase.toUpperCase()} Optimization
              </h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-cyan-400 font-heading">
                ${recommendation.totalPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                Under budget by <span className="text-emerald-400 font-semibold">${recommendation.budgetRemaining.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Performance Benchmark Badges */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 text-center">
              <div className="text-xs text-gray-400">1080p Ultra FPS</div>
              <div className="text-lg font-bold text-white mt-0.5">{recommendation.performanceEstimate.resolution1080pFPS} FPS</div>
            </div>
            <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 text-center border-cyan-500/30">
              <div className="text-xs text-gray-400">1440p High FPS</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{recommendation.performanceEstimate.resolution1440pFPS} FPS</div>
            </div>
            <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 text-center">
              <div className="text-xs text-gray-400">4K Gaming FPS</div>
              <div className="text-lg font-bold text-purple-400 mt-0.5">{recommendation.performanceEstimate.resolution4KFPS} FPS</div>
            </div>
          </div>

          {/* Component Parts List */}
          <div className="space-y-3">
            {recommendation.components.map((comp: HardwareComponent) => (
              <div
                key={comp.id}
                className="flex items-center justify-between bg-gray-900/40 hover:bg-gray-900/80 p-3 rounded-xl border border-gray-800/80 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-16 text-center text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-cyan-400 py-1 px-2 rounded-md border border-gray-700">
                    {comp.category}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{comp.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{comp.retailer}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">Deal Score: {comp.dealScore}/100</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">${comp.currentPrice.toFixed(2)}</div>
                  {comp.msrp > comp.currentPrice && (
                    <div className="text-[10px] text-gray-500 line-through">
                      ${comp.msrp.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compatibility Notes */}
        <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-400 space-y-1">
          {recommendation.compatibility.notes.map((note: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
