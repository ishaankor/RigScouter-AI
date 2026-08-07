import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query || body.url;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid product search query or retailer URL.' },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query }),
      signal: AbortSignal.timeout(90_000), // 90s timeout for multi-retailer scrape
    });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(err, { status: backendRes.status });
    }

    const data = await backendRes.json();
    // Normalize response shape so existing consumers (WatchlistManager) still work
    const result = data.result;
    return NextResponse.json({
      source: 'tavily_autonomous_agent_backend',
      query,
      scrapedAt: new Date().toISOString(),
      bestOffer: result?.bestOffer || null,
      allOffers: result?.scrapedOffers || [],
      component: result?.bestOffer ? {
        id: `agent-${Date.now()}`,
        name: result.bestOffer.title,
        category: result.category,
        brand: result.bestOffer.title.split(' ')[0],
        model: query,
        specs: {},
        msrp: result.bestOffer.originalPrice || Math.round(result.bestOffer.price * 1.12 * 100) / 100,
        currentPrice: result.bestOffer.price,
        lowestPrice90d: Math.round(result.bestOffer.price * 0.96 * 100) / 100,
        retailer: result.bestOffer.retailer,
        productUrl: result.bestOffer.url,
        imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
        rating: 4.8,
        dealScore: 95,
      } : null,
    });
  } catch (error: any) {
    console.error('[/api/scrape proxy error]', error?.message || error);
    return NextResponse.json(
      { error: error.message || 'Backend scrape proxy failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
    || req.nextUrl.searchParams.get('url')
    || 'RTX 4070 Super';

  // Forward to backend agent
  try {
    const backendRes = await fetch(
      `${BACKEND_URL}/api/agent/run?query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(90_000) }
    );
    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
