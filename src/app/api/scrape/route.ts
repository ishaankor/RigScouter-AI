import { NextRequest, NextResponse } from 'next/server';
import { scrapeTavilyAndSaveToDb } from '@/lib/scrapers/tavily-scraper';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query || body.url;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid product search query or retailer URL.' }, { status: 400 });
    }

    // Scrape Tavily Web Search and Save Result directly to Database
    const scrapeResult = await scrapeTavilyAndSaveToDb(query);
    return NextResponse.json(scrapeResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tavily web scrape failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || req.nextUrl.searchParams.get('url') || 'RTX 4070 Super';
  const scrapeResult = await scrapeTavilyAndSaveToDb(query);
  return NextResponse.json(scrapeResult);
}
