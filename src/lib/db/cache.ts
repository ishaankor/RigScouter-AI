import { HardwareComponent } from '../types/hardware';
import { supabase } from './supabase';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 Hours Cache Window

export interface CachedQueryResult {
  component: HardwareComponent;
  isCached: boolean;
  cacheAgeMinutes: number;
}

// Get cached hardware component from Supabase DB or return null if stale/missing
export async function getCachedHardwareComponent(queryOrName: string): Promise<CachedQueryResult | null> {
  try {
    const cleanQuery = queryOrName.toLowerCase().trim();
    const { data, error } = await supabase
      .from('hardware_components')
      .select('*')
      .or(`name.ilike.%${cleanQuery}%,model.ilike.%${cleanQuery}%`)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const existing = data[0];
    const ageMs = Date.now() - new Date(existing.updated_at || Date.now()).getTime();
    if (ageMs > CACHE_TTL_MS) return null;

    let parsedSpecs = {};
    try {
      parsedSpecs = typeof existing.specs === 'string' ? JSON.parse(existing.specs) : (existing.specs || {});
    } catch {
      parsedSpecs = {};
    }

    return {
      isCached: true,
      cacheAgeMinutes: Math.round(ageMs / (1000 * 60)),
      component: {
        id: existing.id,
        name: existing.name,
        category: existing.category as any,
        brand: existing.brand,
        model: existing.model,
        specs: parsedSpecs,
        msrp: existing.msrp,
        currentPrice: existing.current_price,
        lowestPrice90d: existing.lowest_price_90d,
        retailer: existing.retailer as any,
        productUrl: existing.product_url,
        imageUrl: existing.image_url,
        rating: existing.rating,
        dealScore: existing.deal_score,
        benchmarkScore: existing.benchmark_score || undefined
      }
    };
  } catch (e) {
    console.warn('Supabase DB Cache lookup warning:', e);
    return null;
  }
}

// Save or update scraped hardware component snapshot into Supabase DB
export async function saveHardwareComponentToCache(comp: HardwareComponent): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('hardware_components')
      .upsert({
        id: comp.id,
        name: comp.name,
        category: comp.category,
        brand: comp.brand,
        model: comp.model,
        specs: JSON.stringify(comp.specs || {}),
        msrp: comp.msrp,
        current_price: comp.currentPrice,
        lowest_price_90d: comp.lowestPrice90d,
        retailer: comp.retailer,
        product_url: comp.productUrl,
        image_url: comp.imageUrl,
        rating: comp.rating,
        deal_score: comp.dealScore,
        benchmark_score: comp.benchmarkScore || null,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase DB Save Error (Check Row Level Security policies):', error.message, error.details);
    } else {
      console.log(`Successfully persisted scraped item "${comp.name}" into Supabase DB!`);
    }
  } catch (e) {
    console.warn('Failed to save component to Supabase DB cache:', e);
  }
}
