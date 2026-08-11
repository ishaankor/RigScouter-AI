import { HardwareComponent, RetailerName, ComponentCategory } from '../types/hardware';
import { calculateDealScore } from './price-scraper';
import { saveHardwareComponentToCache } from '../db/cache';

export interface TavilyScrapeResponse {
  query: string;
  scrapedAt: string;
  source: 'tavily_live_web';
  component: HardwareComponent;
}

const rawTavilyKey = process.env.TAVILY_API_KEY || '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';
const TAVILY_API_KEYS = rawTavilyKey.split(',').map(k => k.trim()).filter(Boolean);
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Live Web Scraper using Tavily Search API + Groq LLM Extraction
export async function scrapeTavilyAndSaveToDb(queryOrUrl: string): Promise<TavilyScrapeResponse> {
  const cleanQuery = queryOrUrl.trim();
  const category = detectCategory(cleanQuery);
  const isUrl = cleanQuery.startsWith('http://') || cleanQuery.startsWith('https://');

  let productTitle = cleanQuery;
  let productUrl = isUrl ? cleanQuery : `https://www.amazon.com/s?k=${encodeURIComponent(cleanQuery)}`;
  let retailer: RetailerName = detectRetailer(cleanQuery);
  let livePrice: number | null = null;
  let rawContent = '';

  for (const activeKey of TAVILY_API_KEYS) {
    if (livePrice) break;
    try {
      const searchQuery = isUrl
        ? `extract price product title ${cleanQuery}`
        : `buy current price ${cleanQuery} site:amazon.com OR site:microcenter.com OR site:newegg.com OR site:bestbuy.com`;

      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: activeKey,
          query: searchQuery,
          search_depth: 'advanced',
          max_results: 5,
          include_domains: ['amazon.com', 'microcenter.com', 'newegg.com', 'bestbuy.com', 'bhphotovideo.com', 'ebay.com']
        })
      });

      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        console.log(`Tavily Primary Search returned ${results.length} results.`);
        if (results.length > 0) {
          const topHit = results[0];
          productTitle = topHit.title || cleanQuery;
          productUrl = topHit.url || productUrl;
          retailer = detectRetailer(topHit.url || cleanQuery);
          rawContent = (topHit.content || '') + ' ' + (topHit.title || '');

          const parsed = await parsePriceWithGroqLLM(rawContent, cleanQuery, retailer, category);
          if (parsed && parsed.price) {
            livePrice = parsed.price;
            if (parsed.title) productTitle = parsed.title;
          }
        }
      } else {
        console.log('Tavily Primary HTTP Error:', res.status, await res.text());
      }
    } catch (err) {
      console.error('Tavily API primary fetch failed:', err);
    }
  }

  // 2. Secondary targeted query if price wasn't found in first snippet
  if (!livePrice) {
    for (const activeKey of TAVILY_API_KEYS) {
      if (livePrice) break;
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: activeKey,
            query: `current price dollar amount for ${cleanQuery}`,
            search_depth: 'basic',
            max_results: 3
          })
        });

        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          console.log(`Tavily Secondary Search returned ${results.length} results.`);
          for (const hit of results) {
            const text = (hit.content || '') + ' ' + (hit.title || '');
            const parsed = await parsePriceWithGroqLLM(text, cleanQuery, detectRetailer(hit.url || ''), category);
            if (parsed && parsed.price) {
              livePrice = parsed.price;
              if (!productTitle || productTitle === cleanQuery) productTitle = parsed.title || hit.title;
              if (!isUrl && hit.url) productUrl = hit.url;
              retailer = detectRetailer(hit.url || '');
              break;
            }
          }
        } else {
          console.log('Tavily Secondary HTTP Error:', res.status, await res.text());
        }
      } catch (err) {
        console.error('Tavily API secondary price fetch failed:', err);
      }
    }
  }

  // Final price safety fallback (Abort if no valid price found)
  if (!livePrice || livePrice <= 0) {
    return {
      query: cleanQuery,
      scrapedAt: new Date().toISOString(),
      source: 'tavily_live_web',
      component: null as any // Allow caller to handle failure
    };
  }

  const finalPrice = livePrice;
  const msrp = Math.round((finalPrice * 1.12) * 100) / 100;
  const lowest90d = Math.round((finalPrice * 0.95) * 100) / 100;
  const dealScore = calculateDealScore(msrp, finalPrice, lowest90d);

  const component: HardwareComponent = {
    id: `tavily-${Date.now()}`,
    name: productTitle,
    category,
    brand: extractBrand(productTitle),
    model: cleanQuery,
    specs: { ScrapedVia: 'Tavily Search API', ScrapedAt: new Date().toISOString() },
    msrp,
    currentPrice: finalPrice,
    lowestPrice90d: lowest90d,
    retailer,
    productUrl,
    imageUrl: getCategoryImage(category),
    rating: 4.8,
    dealScore
  };

  // PERSIST LIVE SCRAPED ITEM TO SUPABASE DATABASE
  await saveHardwareComponentToCache(component);

  return {
    query: cleanQuery,
    scrapedAt: new Date().toISOString(),
    source: 'tavily_live_web',
    component
  };
}

async function parsePriceWithGroqLLM(text: string, query: string, retailer: string, category: string): Promise<{ price: number | null, title?: string } | null> {
  if (!text || !GROQ_API_KEY) return null;
  
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: `You are a high-precision PC hardware price extraction AI. 
Extract EXACT primary sale price. Ignore sponsored ads. DO NOT extract prices for accessories (cables, protection plans, brackets).
Output strict JSON: {"currentPrice": number or null, "cleanTitle": string}` 
          },
          { 
            role: 'user', 
            content: `Item: "${query}" (${category})\nRetailer: "${retailer}"\nContent:\n${text.substring(0, 4000)}` 
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log('GROQ RAW RESPONSE:', data.choices?.[0]?.message?.content);
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      if (typeof parsed.currentPrice === 'number' && parsed.currentPrice > 15 && parsed.currentPrice <= 6000) {
        return {
          price: parsed.currentPrice,
          title: parsed.cleanTitle
        };
      } else {
        console.log('GROQ parse failed condition:', parsed);
      }
    } else {
      console.log('GROQ HTTP Error:', res.status, await res.text());
    }
  } catch (e) {
    console.warn('Groq LLM extraction failed in edge scraper:', e);
  }
  return null;
}

function detectRetailer(urlOrText: string): RetailerName {
  const lower = urlOrText.toLowerCase();
  if (lower.includes('microcenter.com') || lower.includes('micro center')) return 'Micro Center';
  if (lower.includes('newegg.com') || lower.includes('newegg')) return 'Newegg';
  if (lower.includes('bestbuy.com') || lower.includes('best buy')) return 'Best Buy';
  if (lower.includes('bhphotovideo.com') || lower.includes('b&h')) return 'B&H';
  if (lower.includes('ebay.com') || lower.includes('ebay')) return 'eBay';
  return 'Amazon';
}

function detectCategory(title: string): ComponentCategory {
  const lower = title.toLowerCase();
  if (lower.includes('rtx') || lower.includes('radeon') || lower.includes('graphics card') || lower.includes('gpu')) return 'GPU';
  if (lower.includes('ryzen') || lower.includes('intel core') || lower.includes('processor') || lower.includes('cpu')) return 'CPU';
  if (lower.includes('ddr4') || lower.includes('ddr5') || lower.includes('ram') || lower.includes('memory')) return 'RAM';
  if (lower.includes('ssd') || lower.includes('nvme') || lower.includes('m.2') || lower.includes('storage')) return 'SSD';
  if (lower.includes('motherboard') || lower.includes('mobo') || lower.includes('b650') || lower.includes('z790')) return 'Motherboard';
  if (lower.includes('power supply') || lower.includes('psu') || lower.includes('watt')) return 'PSU';
  if (lower.includes('case') || lower.includes('chassis')) return 'Case';
  return 'Cooler';
}

function extractBrand(title: string): string {
  const firstWord = title.split(' ')[0] || 'Hardware';
  if (['NVIDIA', 'AMD', 'Intel', 'ASUS', 'MSI', 'GIGABYTE', 'Corsair', 'Samsung', 'Western Digital', 'Sapphire', 'NZXT'].includes(firstWord)) {
    return firstWord;
  }
  return firstWord;
}

function getCategoryImage(category: ComponentCategory): string {
  switch (category) {
    case 'GPU': return 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80';
    case 'CPU': return 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80';
    case 'RAM': return 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80';
    case 'SSD': return 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80';
    default: return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80';
  }
}
