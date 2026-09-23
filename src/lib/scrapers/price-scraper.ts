import { HardwareComponent, WatchlistItem } from '../types/hardware';
import { fetchTrendingHardwareFromNews } from './trending-engine';

export interface RetailerPriceInfo {
  retailer?: string;
  price: number;
  originalPrice?: number | null;
}

export interface DealTier {
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  isHot: boolean;
}

export function getDealScoreTier(score: number): DealTier {
  if (score >= 90) {
    return {
      label: 'Exceptional Deal',
      badgeBg: 'bg-emerald-950/80 border-emerald-500/50',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/50',
      isHot: true
    };
  }
  if (score >= 75) {
    return {
      label: 'Great Deal',
      badgeBg: 'bg-emerald-950/60 border-emerald-600/40',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-600/40',
      isHot: true
    };
  }
  if (score >= 65) {
    return {
      label: 'Good Price',
      badgeBg: 'bg-amber-950/60 border-amber-600/40',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-600/40',
      isHot: false
    };
  }
  return {
    label: 'Market Price',
    badgeBg: 'bg-gray-900 border-gray-800',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-800',
    isHot: false
  };
}

/**
 * Intelligent Multi-Retailer Deal Scoring Engine (0 - 100).
 * Evaluates:
 * 1. Cross-retailer market spread (arbitrage vs highest competing retailer)
 * 2. True MSRP discount
 * 3. Market Champion status (lowest price across all active retailers)
 * 4. Distance to 90-day all-time low
 */
export function calculateMultiRetailerDealScore(
  currentPrice: number,
  allOffers: RetailerPriceInfo[] = [],
  msrp?: number,
  lowest90d?: number
): number {
  if (currentPrice <= 0) return 50;

  const validPrices = allOffers
    .map(o => Number(o?.price || 0))
    .filter(p => p > 0);

  const highestRetailerPrice = validPrices.length > 0 ? Math.max(...validPrices) : currentPrice;
  const lowestRetailerPrice = validPrices.length > 0 ? Math.min(...validPrices) : currentPrice;
  const effectiveMSRP = (msrp && msrp > currentPrice) ? msrp : highestRetailerPrice;

  let score = 50;

  // 1. Cross-Retailer Arbitrage Bonus (up to +35 pts)
  if (highestRetailerPrice > currentPrice && highestRetailerPrice > 0) {
    const marketSpreadPct = ((highestRetailerPrice - currentPrice) / highestRetailerPrice) * 100;
    score += Math.min(35, marketSpreadPct * 1.15);
  }

  // 2. True MSRP Discount Bonus (up to +15 pts)
  if (effectiveMSRP > currentPrice && effectiveMSRP > highestRetailerPrice) {
    const msrpDiscountPct = ((effectiveMSRP - currentPrice) / effectiveMSRP) * 100;
    score += Math.min(15, msrpDiscountPct * 0.5);
  }

  // 3. Market Champion Bonus (+10 pts if lowest among 2+ retailers)
  if (validPrices.length >= 2 && currentPrice <= lowestRetailerPrice + 0.01) {
    score += 10;
  }

  // 4. 90-Day ATL Bonus (+5 pts)
  if (lowest90d && lowest90d > 0 && currentPrice <= lowest90d + 0.01) {
    score += 5;
  }

  return Math.min(99, Math.max(50, Math.round(score)));
}

// Legacy single-item scoring formula
export function calculateDealScore(msrp: number, currentPrice: number, lowest90d: number): number {
  return calculateMultiRetailerDealScore(currentPrice, [{ price: currentPrice }], msrp, lowest90d);
}

export async function getHardwareCatalog(): Promise<HardwareComponent[]> {
  return fetchTrendingHardwareFromNews();
}

export const MOCK_HARDWARE_CATALOG: HardwareComponent[] = [];
export const MOCK_INITIAL_WATCHLIST: WatchlistItem[] = [];

