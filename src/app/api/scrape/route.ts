import { NextRequest, NextResponse } from 'next/server';
import { scrapeLiveHardware } from '@/lib/scrapers/live-scraper';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query || body.url;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid product search query or retailer URL.' }, { status: 400 });
    }

    const scrapedData = await scrapeLiveHardware(query);
    return NextResponse.json(scrapedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Scraping failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('query') || req.nextUrl.searchParams.get('url') || 'RTX 4070 Super';
  const scrapedData = await scrapeLiveHardware(url);
  return NextResponse.json(scrapedData);
}
