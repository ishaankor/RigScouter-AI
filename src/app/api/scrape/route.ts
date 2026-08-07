import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

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

    const cleanQuery = query.trim();

    // 1. Check Supabase Database catalog first for instant response
    try {
      const { data: dbMatches } = await supabase
        .from('hardware_components')
        .select('*')
        .or(`name.ilike.%${cleanQuery}%,model.ilike.%${cleanQuery}%,product_url.ilike.%${cleanQuery}%`)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (dbMatches && dbMatches.length > 0) {
        const match = dbMatches[0];
        console.log(`[DB Fast Match Hit] Found "${match.name}" ($${match.current_price}) in database!`);
        return NextResponse.json({
          source: 'supabase_database_cache',
          query: cleanQuery,
          scrapedAt: match.updated_at,
          bestOffer: {
            title: match.name,
            price: match.current_price,
            originalPrice: match.msrp,
            retailer: match.retailer,
            url: match.product_url,
            brand: match.brand,
            inStock: true
          },
          component: {
            id: match.id,
            name: match.name,
            category: match.category,
            brand: match.brand,
            model: match.model,
            specs: typeof match.specs === 'string' ? JSON.parse(match.specs || '{}') : (match.specs || {}),
            msrp: match.msrp,
            currentPrice: match.current_price,
            lowestPrice90d: match.lowest_price_90d,
            retailer: match.retailer,
            productUrl: match.product_url,
            imageUrl: match.image_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
            rating: match.rating || 4.8,
            dealScore: match.deal_score || 85
          }
        });
      }
    } catch (dbErr) {
      console.warn('[DB Fast Check Warning]:', dbErr);
    }

    // 2. If not found in Database, trigger backend agent to scrape live across retailers & save to DB
    console.log(`[DB Cache Miss] Item "${cleanQuery}" not in DB — activating backend Tavily/Firecrawl scraper...`);

    const backendRes = await fetch(`${BACKEND_URL}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: cleanQuery }),
      signal: AbortSignal.timeout(90_000), // 90s timeout for multi-retailer scrape
    });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(err, { status: backendRes.status });
    }

    const data = await backendRes.json();
    const result = data.result;

    return NextResponse.json({
      source: 'tavily_autonomous_agent_backend',
      query: cleanQuery,
      scrapedAt: new Date().toISOString(),
      bestOffer: result?.bestOffer || null,
      allOffers: result?.scrapedOffers || [],
      component: result?.bestOffer ? {
        id: `agent-${Date.now()}`,
        name: result.bestOffer.title,
        category: result.category,
        brand: result.bestOffer.brand || result.bestOffer.title.split(' ')[0],
        model: cleanQuery,
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

  const cleanQuery = query.trim();

  // 1. Check Supabase Database catalog first
  try {
    const { data: dbMatches } = await supabase
      .from('hardware_components')
      .select('*')
      .or(`name.ilike.%${cleanQuery}%,model.ilike.%${cleanQuery}%,product_url.ilike.%${cleanQuery}%`)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (dbMatches && dbMatches.length > 0) {
      const match = dbMatches[0];
      return NextResponse.json({
        source: 'supabase_database_cache',
        result: {
          bestOffer: {
            title: match.name,
            price: match.current_price,
            originalPrice: match.msrp,
            retailer: match.retailer,
            url: match.product_url,
            brand: match.brand,
            inStock: true
          },
          category: match.category
        }
      });
    }
  } catch (e) {}

  // 2. Forward to backend agent if not in DB
  try {
    const backendRes = await fetch(
      `${BACKEND_URL}/api/agent/run?query=${encodeURIComponent(cleanQuery)}`,
      { signal: AbortSignal.timeout(90_000) }
    );
    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
