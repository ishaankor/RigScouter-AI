import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { MOCK_HARDWARE_CATALOG } from '@/lib/scrapers/price-scraper';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');
    const query = req.nextUrl.searchParams.get('q');

    let dbQuery = supabase.from('hardware_components').select('*');

    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }
    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,model.ilike.%${query}%,brand.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery.order('updated_at', { ascending: false }).limit(50);

    if (!error && data && data.length > 0) {
      const formatted = data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category as any,
        brand: item.brand,
        model: item.model,
        specs: typeof item.specs === 'string' ? JSON.parse(item.specs || '{}') : (item.specs || {}),
        msrp: item.msrp,
        currentPrice: item.current_price,
        lowestPrice90d: item.lowest_price_90d,
        retailer: item.retailer as any,
        productUrl: item.product_url,
        imageUrl: item.image_url,
        rating: item.rating,
        dealScore: item.deal_score,
        benchmarkScore: item.benchmark_score || undefined
      }));

      return NextResponse.json({ source: 'database', components: formatted });
    }
  } catch (e) {
    console.warn('Supabase DB fetch fallback to catalog:', e);
  }

  // Fallback catalog if DB has no items yet
  return NextResponse.json({ source: 'catalog', components: MOCK_HARDWARE_CATALOG });
}
