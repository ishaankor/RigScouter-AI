import { HardwareComponent, WatchlistItem } from '../types/hardware';
import { supabase } from '../db/supabase';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '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';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rigscouter-ai-database.onrender.com';

/**
 * Searches the internet for trending PC hardware news via Tavily AI,
 * uses LLM to discover what parts are currently trending, triggers live retailer scraping,
 * and returns real hardware components from Supabase database.
 */
export async function fetchTrendingHardwareFromNews(): Promise<HardwareComponent[]> {
  try {
    console.log('[Trending Engine] Searching internet news for trending PC hardware via Tavily AI...');

    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: 'trending PC hardware graphics card GPU processor CPU deals releases news',
        topic: 'news',
        search_depth: 'advanced',
        max_results: 6
      })
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const newsSnippets = (searchData.results || []).map((r: any) => `${r.title}: ${r.content}`).join('\n');

      if (GROQ_API_KEY) {
        const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: 'You are a tech news analyst. Extract a JSON array of up to 6 trending PC hardware model names (e.g. ["RTX 4070 Super", "Ryzen 7 7800X3D", "RTX 5070", "Samsung 990 Pro 2TB"]). Output JSON ONLY: { "trendingModels": string[] }'
              },
              { role: 'user', content: `Tech news snippets:\n${newsSnippets.substring(0, 3000)}` }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });

        if (llmRes.ok) {
          const llmData = await llmRes.json();
          const parsed = JSON.parse(llmData.choices?.[0]?.message?.content || '{}');
          const models: string[] = parsed.trendingModels || [];

          console.log('[Trending Engine] Discovered trending hardware models from news:', models);

          // Trigger live scraper backend for newly discovered trending items
          for (const model of models.slice(0, 4)) {
            try {
              fetch(`${BACKEND_URL}/api/agent/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: model })
              }).catch(() => {});
            } catch (e) {}
          }
        }
      }
    }
  } catch (e) {
    console.warn('[Trending Engine News Discovery Warning]:', e);
  }

  // Return real scraped hardware components from Supabase database
  const { data: dbItems } = await supabase
    .from('hardware_components')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20);

  if (dbItems && dbItems.length > 0) {
    const rawComponents = dbItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category as any,
      brand: item.brand,
      model: item.model,
      specs: typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {}),
      msrp: item.msrp,
      currentPrice: item.current_price,
      lowestPrice90d: item.lowest_price_90d,
      retailer: item.retailer as any,
      productUrl: item.product_url,
      imageUrl: item.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      rating: item.rating || 4.5,
      dealScore: item.deal_score || 75
    }));

    return groupHardwareComponentsByModel(rawComponents);
  }

  return [];
}

/**
 * Groups multiple partner card variants (e.g. MSI Ventus 2X, ASUS Dual, Gigabyte Windforce)
 * under their unified base model (e.g. "RTX 4070 Super", "GTX 1080 Ti"),
 * featuring the lowest price as the primary deal.
 */
export function groupHardwareComponentsByModel(components: HardwareComponent[]): HardwareComponent[] {
  const modelMap = new Map<string, HardwareComponent[]>();

  for (const item of components) {
    const key = (item.model || item.name).trim();
    if (!modelMap.has(key)) {
      modelMap.set(key, []);
    }
    modelMap.get(key)!.push(item);
  }

  const grouped: HardwareComponent[] = [];

  modelMap.forEach((items, modelGroup) => {
    // Sort items in this model group by lowest current price
    items.sort((a, b) => a.currentPrice - b.currentPrice);
    const bestDeal = { ...items[0] };

    // Attach all variant offers under specs
    bestDeal.specs = {
      ...bestDeal.specs,
      modelGroup,
      variantCount: items.length,
      allVariants: items.map(v => ({
        name: v.name,
        brand: v.brand,
        price: v.currentPrice,
        retailer: v.retailer,
        productUrl: v.productUrl
      }))
    };

    grouped.push(bestDeal);
  });

  return grouped;
}

export function getDailyTrendingComponents(): HardwareComponent[] {
  return [];
}

export function getDailyTrendingWatchlist(): WatchlistItem[] {
  return [];
}
