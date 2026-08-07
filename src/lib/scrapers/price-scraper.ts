import { HardwareComponent, WatchlistItem } from '../types/hardware';
import { fetchTrendingHardwareFromNews } from './trending-engine';

// Pure Deal Score Calculation Formula (0 - 100) based on MSRP discount & 90-day lowest price
export function calculateDealScore(msrp: number, currentPrice: number, lowest90d: number): number {
  if (msrp <= 0) return 50;
  const discountFromMSRP = ((msrp - currentPrice) / msrp) * 100;
  const distanceToLowest = Math.max(0, currentPrice - lowest90d);

  let score = 50 + discountFromMSRP * 1.5;
  if (distanceToLowest === 0) {
    score += 20; // Reached or beaten 90-day all-time low!
  } else if (distanceToLowest < 10) {
    score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export async function getHardwareCatalog(): Promise<HardwareComponent[]> {
  return fetchTrendingHardwareFromNews();
}

export const MOCK_HARDWARE_CATALOG: HardwareComponent[] = [];
export const MOCK_INITIAL_WATCHLIST: WatchlistItem[] = [];
