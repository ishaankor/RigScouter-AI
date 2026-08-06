import { prisma } from './prisma';
import { HardwareComponent } from '../types/hardware';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 Hours Cache Window

export interface CachedQueryResult {
  component: HardwareComponent;
  isCached: boolean;
  cacheAgeMinutes: number;
}

// Get cached hardware component or return null if stale/missing
export async function getCachedHardwareComponent(queryOrName: string): Promise<CachedQueryResult | null> {
  try {
    const cleanQuery = queryOrName.toLowerCase().trim();
    const existing = await prisma.hardwareComponent.findFirst({
      where: {
        OR: [
          { name: { contains: cleanQuery } },
          { model: { contains: cleanQuery } },
          { productUrl: { contains: cleanQuery } }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!existing) return null;

    const ageMs = Date.now() - new Date(existing.updatedAt).getTime();
    if (ageMs > CACHE_TTL_MS) {
      return null; // Cache expired (stale)
    }

    let parsedSpecs = {};
    try {
      parsedSpecs = JSON.parse(existing.specs);
    } catch {
      parsedSpecs = {};
    }

    return {
      isCached: true,
      cacheAgeMinutes: Math.round(ageMs / (1000 * 60)),
      component: {
        id: existing.id,
        name: existing.name,
        category: existing.category as any,
        brand: existing.brand,
        model: existing.model,
        specs: parsedSpecs,
        msrp: existing.msrp,
        currentPrice: existing.currentPrice,
        lowestPrice90d: existing.lowestPrice90d,
        retailer: existing.retailer as any,
        productUrl: existing.productUrl,
        imageUrl: existing.imageUrl,
        rating: existing.rating,
        dealScore: existing.dealScore,
        benchmarkScore: existing.benchmarkScore || undefined
      }
    };
  } catch (e) {
    console.warn('DB Cache lookup error:', e);
    return null;
  }
}

// Save or update scraped hardware component snapshot into DB
export async function saveHardwareComponentToCache(comp: HardwareComponent): Promise<void> {
  try {
    await prisma.hardwareComponent.upsert({
      where: { id: comp.id },
      update: {
        name: comp.name,
        category: comp.category,
        brand: comp.brand,
        model: comp.model,
        specs: JSON.stringify(comp.specs || {}),
        msrp: comp.msrp,
        currentPrice: comp.currentPrice,
        lowestPrice90d: comp.lowestPrice90d,
        retailer: comp.retailer,
        productUrl: comp.productUrl,
        imageUrl: comp.imageUrl,
        rating: comp.rating,
        dealScore: comp.dealScore,
        benchmarkScore: comp.benchmarkScore
      },
      create: {
        id: comp.id,
        name: comp.name,
        category: comp.category,
        brand: comp.brand,
        model: comp.model,
        specs: JSON.stringify(comp.specs || {}),
        msrp: comp.msrp,
        currentPrice: comp.currentPrice,
        lowestPrice90d: comp.lowestPrice90d,
        retailer: comp.retailer,
        productUrl: comp.productUrl,
        imageUrl: comp.imageUrl,
        rating: comp.rating,
        dealScore: comp.dealScore,
        benchmarkScore: comp.benchmarkScore
      }
    });
  } catch (e) {
    console.warn('Failed to save component to DB cache:', e);
  }
}
