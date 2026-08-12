import { HardwareComponent, RetailerName, ComponentCategory } from '../types/hardware';
import { calculateDealScore } from './price-scraper';
import { saveHardwareComponentToCache } from '../db/cache';

export interface TavilyScrapeResponse {
  query: string;
  scrapedAt: string;
  source: 'tavily_live_web' | 'diffbot_direct';
  component: HardwareComponent;
}

const rawTavilyKey = process.env.TAVILY_API_KEY || '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';
const TAVILY_API_KEYS = rawTavilyKey.split(',').map(k => k.trim()).filter(Boolean);
const DIFFBOT_TOKEN = process.env.DIFFBOT_TOKEN || '';

// Live Web Scraper using Tavily Search API + DiffBot Product Extraction
export async function scrapeTavilyAndSaveToDb(queryOrUrl: string): Promise<TavilyScrapeResponse> {
  const cleanQuery = queryOrUrl.trim();
  const category = detectCategory(cleanQuery);
  const isUrl = cleanQuery.startsWith('http://') || cleanQuery.startsWith('https://');

  let bestPrice: number | null = null;
  let bestTitle = cleanQuery;
  let bestUrl = isUrl ? cleanQuery : '';
  let bestRetailer: RetailerName = detectRetailer(cleanQuery);

  if (isUrl) {
    // 1. Direct Diffbot Extraction for URLs
    const diffData = await extractProductWithDiffBot(cleanQuery);
    if (diffData && diffData.price) {
      bestPrice = diffData.price;
      if (diffData.title) bestTitle = diffData.title;
      bestRetailer = detectRetailer(cleanQuery);
    }
  } else {
    // 2. Hybrid: Tavily Search -> DiffBot Extraction
    let urlsToCheck: string[] = [];
    
    // Step A: Find Product URLs
    for (const activeKey of TAVILY_API_KEYS) {
      if (urlsToCheck.length > 0) break;
      try {
        const searchQuery = `${cleanQuery} amazon OR newegg OR bestbuy OR microcenter`;
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: activeKey,
            query: searchQuery,
            search_depth: 'advanced',
            max_results: 1,
            include_domains: ['amazon.com', 'microcenter.com', 'newegg.com', 'bestbuy.com', 'bhphotovideo.com', 'ebay.com']
          })
        });

        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          urlsToCheck = results.map((r: any) => r.url).filter(Boolean);
          console.log(`Tavily found ${urlsToCheck.length} URLs for DiffBot extraction.`);
        } else {
          console.log('Tavily Primary HTTP Error:', res.status, await res.text());
        }
      } catch (err) {
        console.error('Tavily API search failed:', err);
      }
    }

    // Step B: Extract Pricing from URLs using DiffBot
    for (const url of urlsToCheck) {
      console.log(`[DiffBot] Checking URL: ${url}`);
      const diffData = await extractProductWithDiffBot(url);
      if (diffData && diffData.price) {
        // Pick the lowest price we can find across the top results
        if (!bestPrice || diffData.price < bestPrice) {
          bestPrice = diffData.price;
          bestTitle = diffData.title || bestTitle;
          bestUrl = url;
          bestRetailer = detectRetailer(url);
        }
      }
    }
  }

  // Final price safety fallback (Abort if no valid price found)
  if (!bestPrice || bestPrice <= 0) {
    return {
      query: cleanQuery,
      scrapedAt: new Date().toISOString(),
      source: isUrl ? 'diffbot_direct' : 'tavily_live_web',
      component: null as any // Allow caller to handle failure
    };
  }

  const finalPrice = bestPrice;
  const msrp = Math.round((finalPrice * 1.12) * 100) / 100;
  const lowest90d = Math.round((finalPrice * 0.95) * 100) / 100;
  const dealScore = calculateDealScore(msrp, finalPrice, lowest90d);

  const component: HardwareComponent = {
    id: `hybrid-${Date.now()}`,
    name: bestTitle,
    category,
    brand: extractBrand(bestTitle),
    model: cleanQuery,
    specs: { ScrapedVia: isUrl ? 'DiffBot' : 'Tavily + DiffBot', ScrapedAt: new Date().toISOString() },
    msrp,
    currentPrice: finalPrice,
    lowestPrice90d: lowest90d,
    retailer: bestRetailer,
    productUrl: bestUrl,
    imageUrl: getCategoryImage(category),
    rating: 4.8,
    dealScore
  };

  // PERSIST LIVE SCRAPED ITEM TO SUPABASE DATABASE
  await saveHardwareComponentToCache(component);

  return {
    query: cleanQuery,
    scrapedAt: new Date().toISOString(),
    source: isUrl ? 'diffbot_direct' : 'tavily_live_web',
    component
  };
}

const RESIDENTIAL_PROXY = process.env.RESIDENTIAL_PROXY || '';
const RESIDENTIAL_PROXY_AUTH = process.env.RESIDENTIAL_PROXY_AUTH || '';

async function extractProductWithDiffBot(url: string, retryCount = 0): Promise<{ price: number | null, title?: string } | null> {
  if (!url) return null;
  
  if (!DIFFBOT_TOKEN) {
    console.warn('Missing DIFFBOT_TOKEN environment variable. Cannot extract price for', url);
    return null;
  }
  
  try {
    // Add &proxy and &render=true to bypass blocks and wait for dynamic content
    let proxyParam = '&proxy'; 
    if (retryCount > 0 && RESIDENTIAL_PROXY) {
      proxyParam = `&proxy=${encodeURIComponent(RESIDENTIAL_PROXY)}`;
      if (RESIDENTIAL_PROXY_AUTH) {
        proxyParam += `&proxyAuth=${encodeURIComponent(RESIDENTIAL_PROXY_AUTH)}`;
      }
      console.log(`[DiffBot] Using custom residential proxy on attempt ${retryCount + 1}`);
    }

    const diffbotUrl = `https://api.diffbot.com/v3/product?token=${DIFFBOT_TOKEN}&url=${encodeURIComponent(url)}${proxyParam}&render=true`;
    
    const res = await fetch(diffbotUrl, {
      headers: {
        // Forward realistic headers to the target site via Diffbot
        'X-Forward-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'X-Forward-Accept-Language': 'en-US,en;q=0.9',
        'X-Forward-Referer': 'https://www.google.com/'
      }
    });
    
    let isBlocked = (res.status === 429 || res.status === 503 || res.status === 403);
    let data: any = null;

    if (res.ok) {
      data = await res.json();
      const object = data.objects?.[0];
      
      // Amazon specifically returns 200 OK but shows the CAPTCHA page
      if (object && object.title && (object.title.includes('Conditions of Use') || object.title.includes('Bot Activity'))) {
        isBlocked = true;
        console.warn(`[DiffBot] Amazon CAPTCHA detected for ${url}`);
      }
    }

    if (isBlocked) {
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.warn(`[DiffBot] Blocked / CAPTCHA. Retrying in ${delay}ms... (Attempt ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, delay));
        return extractProductWithDiffBot(url, retryCount + 1);
      } else {
        console.warn(`[DiffBot] Exhausted retries for ${url}`);
        return null;
      }
    }

    if (res.ok && data) {
      const object = data.objects?.[0];
      if (object) {
        console.log(`[DiffBot RAW Object for ${url}]:`, JSON.stringify({
           offerPrice: object.offerPrice,
           offerPriceDetails: object.offerPriceDetails,
           regularPrice: object.regularPrice,
           title: object.title
        }, null, 2));
        let price: number | null = null;
        
        // Handle various ways DiffBot might return the price
        if (typeof object.offerPrice === 'number') {
          price = object.offerPrice;
        } else if (typeof object.offerPrice === 'string') {
          price = parseFloat(object.offerPrice.replace(/[^0-9.]/g, ''));
        } else if (object.offerPriceDetails?.amount) {
          price = object.offerPriceDetails.amount;
        } else if (object.regularPrice) {
          price = typeof object.regularPrice === 'number' 
            ? object.regularPrice 
            : parseFloat(object.regularPrice.replace(/[^0-9.]/g, ''));
        }

        // Validate price bounds (e.g. to filter out weird accessories picked up instead)
        if (price !== null && !isNaN(price) && price > 15 && price <= 6000) {
          console.log(`[DiffBot] Successfully extracted $${price} from ${url}`);
          return { price, title: object.title };
        } else {
          console.log(`[DiffBot] Price extraction out of bounds or invalid for ${url}:`, price);
        }
      }
    } else if (!res.ok) {
      console.log('DiffBot HTTP Error:', res.status, await res.text());
    }
  } catch (e) {
    console.warn('DiffBot extraction failed:', e);
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
