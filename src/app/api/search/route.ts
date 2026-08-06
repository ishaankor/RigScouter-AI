import { NextRequest, NextResponse } from 'next/server';
import { scrapeLiveHardware } from '@/lib/scrapers/live-scraper';
import { MOCK_HARDWARE_CATALOG } from '@/lib/scrapers/price-scraper';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ results: MOCK_HARDWARE_CATALOG });
  }

  // Filter catalog items matching query
  const catalogMatches = MOCK_HARDWARE_CATALOG.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase()) ||
    c.brand.toLowerCase().includes(query.toLowerCase())
  );

  // Perform live web scrape for query
  const liveScrape = await scrapeLiveHardware(query);

  return NextResponse.json({
    query,
    results: [liveScrape.component, ...catalogMatches]
  });
}
