import { HardwareComponent, RetailerName, ComponentCategory } from '../types/hardware';
import { scrapeTavilyAndSaveToDb } from './tavily-scraper';

export interface LiveScrapeResult {
  query: string;
  source: 'tavily_web_search' | 'database_cache';
  timestamp: string;
  component: HardwareComponent;
}

// Detect retailer name from URL or query
export function detectRetailer(urlOrText: string): RetailerName {
  const lower = urlOrText.toLowerCase();
  if (lower.includes('microcenter.com') || lower.includes('micro center')) return 'Micro Center';
  if (lower.includes('newegg.com') || lower.includes('newegg')) return 'Newegg';
  if (lower.includes('bestbuy.com') || lower.includes('best buy')) return 'Best Buy';
  if (lower.includes('bhphotovideo.com') || lower.includes('b&h')) return 'B&H';
  if (lower.includes('ebay.com') || lower.includes('ebay')) return 'eBay';
  return 'Amazon';
}

// Categorize product based on keywords
export function detectCategory(title: string): ComponentCategory {
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

// Delegate live scraping directly to Tavily Scraper + Supabase DB persistence
export async function scrapeLiveHardware(queryOrUrl: string): Promise<LiveScrapeResult> {
  const tavilyResult = await scrapeTavilyAndSaveToDb(queryOrUrl);
  return {
    query: queryOrUrl,
    source: 'tavily_web_search',
    timestamp: tavilyResult.scrapedAt,
    component: tavilyResult.component
  };
}
