export type ComponentCategory = 'GPU' | 'CPU' | 'RAM' | 'SSD' | 'Motherboard' | 'PSU' | 'Case' | 'Cooler';

export type RetailerName = 'Amazon' | 'Micro Center' | 'Newegg' | 'Best Buy' | 'B&H' | 'eBay';

export interface HardwareComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  brand: string;
  model: string;
  specs: Record<string, any>;
  msrp: number;
  currentPrice: number;
  lowestPrice90d: number;
  retailer: RetailerName;
  productUrl: string;
  imageUrl: string;
  rating: number;
  dealScore: number; // 0 to 100
  benchmarkScore?: number; // e.g. 1440p gaming score or Cinebench points
}

export type DigestFrequency = 'daily' | 'every_3_days' | 'weekly' | 'flash_only';

export type ComparisonInterval = '24h' | '7d' | '30d' | 'ATL'; // ATL = All Time Low

export interface WatchlistItem {
  id: string;
  userId: string;
  componentName: string;
  category: ComponentCategory;
  targetPrice: number;
  currentPrice: number;
  previousPrice24h: number;
  previousPrice7d: number;
  previousPrice30d: number;
  allTimeLow: number;
  retailer: RetailerName;
  productUrl: string;
  imageUrl: string;
  inStock: boolean;
  notifyOnFlashDrop: boolean;
  addedAt: string;
  specs?: Record<string, any>;
}

export interface PriceSnapshot {
  id: string;
  watchlistItemId: string;
  price: number;
  inStock: boolean;
  timestamp: string;
}

export interface UserPreferences {
  userId: string;
  summaryFrequency: DigestFrequency;
  deliveryChannels: {
    email: boolean;
    emailAddress?: string;
    discordWebhook?: string;
    telegramChatId?: string;
  };
  comparisonIntervals: ComparisonInterval[];
  autoRecommendAlternatives: boolean;
}

export interface DigestItemSummary {
  item: WatchlistItem;
  change24h: { amount: number; percentage: number };
  change7d: { amount: number; percentage: number };
  change30d: { amount: number; percentage: number };
  isAllTimeLow: boolean;
  dealScore: number;
  alternativePick?: {
    name: string;
    price: number;
    savings: number;
    reason: string;
    url: string;
  };
}

export interface DailyDigestReport {
  id: string;
  generatedAt: string;
  headline: string;
  executiveSummary: string;
  biggestDrop: DigestItemSummary | null;
  items: DigestItemSummary[];
  totalSavedOpportunity: number;
}

export interface RigBuildRequirement {
  budget: number;
  useCase: 'gaming' | 'productivity' | 'streaming' | 'balanced';
  targetResolution: '1080p' | '1440p' | '4K';
  preferredBrands?: string[];
  includePeripherals?: boolean;
}

export interface RigBuildRecommendation {
  totalPrice: number;
  budgetRemaining: number;
  components: HardwareComponent[];
  compatibility: {
    isCompatible: boolean;
    estimatedWattage: number;
    recommendedPSU: number;
    issues: string[];
    notes: string[];
  };
  performanceEstimate: {
    resolution1080pFPS: number;
    resolution1440pFPS: number;
    resolution4KFPS: number;
    productivityRating: string;
  };
}
