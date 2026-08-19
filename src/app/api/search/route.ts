import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { scrapeLiveHardware } from '@/lib/scrapers/live-scraper';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  
  try {
    if (!query) {
      const { data: dbItems } = await supabase
        .from('hardware_components')
        .select('*')
        .order('deal_score', { ascending: false })
        .limit(20);

      const formatted = (dbItems || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        brand: c.brand,
        model: c.model,
        specs: typeof c.specs === 'string' ? JSON.parse(c.specs || '{}') : (c.specs || {}),
        msrp: c.msrp,
        currentPrice: c.current_price,
        lowestPrice90d: c.lowest_price_90d,
        retailer: c.retailer,
        productUrl: c.product_url,
        imageUrl: c.image_url,
        rating: c.rating,
        dealScore: c.deal_score
      }));

      return NextResponse.json({ results: formatted });
    }

    // Filter catalog items matching query from Supabase DB
    const { data: dbMatches } = await supabase
      .from('hardware_components')
      .select('*')
      .or(`name.ilike.%${query}%,model.ilike.%${query}%,brand.ilike.%${query}%`)
      .order('deal_score', { ascending: false })
      .limit(10);

    const catalogMatches = (dbMatches || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      brand: c.brand,
      model: c.model,
      specs: typeof c.specs === 'string' ? JSON.parse(c.specs || '{}') : (c.specs || {}),
      msrp: c.msrp,
      currentPrice: c.current_price,
      lowestPrice90d: c.lowest_price_90d,
      retailer: c.retailer,
      productUrl: c.product_url,
      imageUrl: c.image_url,
      rating: c.rating,
      dealScore: c.deal_score
    }));

    // Perform live web scrape for query
    let liveComponent = null;
    try {
      const liveScrape = await scrapeLiveHardware(query);
      liveComponent = liveScrape.component;
    } catch (e) {}

    const results = liveComponent ? [liveComponent, ...catalogMatches] : catalogMatches;

    return NextResponse.json({
      query,
      results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Search failed' }, { status: 500 });
  }
}
