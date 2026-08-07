import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { scrapeTavilyAndSaveToDb } from '@/lib/scrapers/tavily-scraper';

export const runtime = 'edge';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.BACKEND_URL
  || 'https://rigscouter-ai-database.onrender.com';

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

    // 2. Call Render Backend Scraper Agent Service (60s timeout for cold start)
    console.log(`[Backend Agent Request] Triggering backend multi-retailer agent at ${BACKEND_URL}...`);
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: cleanQuery }),
        signal: AbortSignal.timeout(60_000) // 60s timeout for cold start / multi-store scraping
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        const result = data.result;
        if (result?.bestOffer?.price) {
          return NextResponse.json({
            source: 'tavily_autonomous_agent_backend',
            query: cleanQuery,
            scrapedAt: new Date().toISOString(),
            bestOffer: result.bestOffer,
            allOffers: result.scrapedOffers || [],
            component: {
              id: `agent-${Date.now()}`,
              name: result.bestOffer.title,
              category: result.category || 'GPU',
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
              dealScore: 95
            }
          });
        }
      }
    } catch (agentErr: any) {
      console.warn('[Backend Agent Fetch Warning, activating Edge scraper]:', agentErr?.message || agentErr);
    }

    // 3. Direct Edge Live Scraper Fallback
    console.log(`[Direct Edge Scraper] Executing live web scraper for "${cleanQuery}"...`);
    const liveResult = await scrapeTavilyAndSaveToDb(cleanQuery);

    if (!liveResult.component || !liveResult.component.currentPrice) {
      return NextResponse.json(
        { error: `Could not retrieve live price for "${cleanQuery}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      source: 'tavily_edge_live_scraper',
      query: cleanQuery,
      scrapedAt: liveResult.scrapedAt,
      bestOffer: {
        title: liveResult.component.name,
        price: liveResult.component.currentPrice,
        originalPrice: liveResult.component.msrp,
        retailer: liveResult.component.retailer,
        url: liveResult.component.productUrl
      },
      component: liveResult.component
    });
  } catch (error: any) {
    console.error('[/api/scrape error]:', error?.message || error);
    return NextResponse.json(
      { error: error.message || 'Scrape operation failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
    || req.nextUrl.searchParams.get('url')
    || 'RTX 4070 Super';

  const cleanQuery = query.trim();

  try {
    const liveResult = await scrapeTavilyAndSaveToDb(cleanQuery);
    return NextResponse.json(liveResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
