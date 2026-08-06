import { HardwareComponent, WatchlistItem } from '../types/hardware';
import { calculateDealScore } from './price-scraper';

// Comprehensive pool of real hardware parts for daily rotation
const HARDWARE_ROTATION_POOL: HardwareComponent[] = [
  // GPUs
  {
    id: 'gpu-4080-super-tr',
    name: 'GIGABYTE GeForce RTX 4080 Super GAMING OC 16GB',
    category: 'GPU',
    brand: 'GIGABYTE',
    model: 'RTX 4080 Super',
    specs: { VRAM: '16GB GDDR6X', TDP: '320W', Length: '342mm' },
    msrp: 999.99,
    currentPrice: 969.99,
    lowestPrice90d: 949.99,
    retailer: 'Newegg',
    productUrl: 'https://www.newegg.com/gigabyte-geforce-rtx-4080-super',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 88,
    benchmarkScore: 19800
  },
  {
    id: 'gpu-4070-super-tr',
    name: 'ASUS Dual GeForce RTX 4070 Super OC Edition 12GB',
    category: 'GPU',
    brand: 'ASUS',
    model: 'RTX 4070 Super',
    specs: { VRAM: '12GB GDDR6X', TDP: '220W', Length: '267mm' },
    msrp: 599.99,
    currentPrice: 549.99,
    lowestPrice90d: 539.99,
    retailer: 'Micro Center',
    productUrl: 'https://www.microcenter.com/product/676345/asus-nvidia-geforce-rtx-4070-super',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    dealScore: 92,
    benchmarkScore: 14200
  },
  {
    id: 'gpu-7800xt-tr',
    name: 'Sapphire PULSE AMD Radeon RX 7800 XT 16GB',
    category: 'GPU',
    brand: 'Sapphire',
    model: 'RX 7800 XT',
    specs: { VRAM: '16GB GDDR6', TDP: '263W', Length: '280mm' },
    msrp: 499.99,
    currentPrice: 479.99,
    lowestPrice90d: 469.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0CGGP7WCG',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    dealScore: 89,
    benchmarkScore: 13900
  },
  {
    id: 'gpu-4090-tr',
    name: 'MSI Gaming X Slim GeForce RTX 4090 24GB',
    category: 'GPU',
    brand: 'MSI',
    model: 'RTX 4090',
    specs: { VRAM: '24GB GDDR6X', TDP: '450W' },
    msrp: 1599.99,
    currentPrice: 1749.99,
    lowestPrice90d: 1699.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0CJG5688D',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 78,
    benchmarkScore: 25500
  },

  // CPUs
  {
    id: 'cpu-7800x3d-tr',
    name: 'AMD Ryzen 7 7800X3D 8-Core 16-Thread Desktop Processor',
    category: 'CPU',
    brand: 'AMD',
    model: 'Ryzen 7 7800X3D',
    specs: { Socket: 'AM5', Cores: 8, Threads: 16, BoostClock: '5.0GHz' },
    msrp: 449.00,
    currentPrice: 339.00,
    lowestPrice90d: 339.00,
    retailer: 'Micro Center',
    productUrl: 'https://www.microcenter.com/product/663663/amd-ryzen-7-7800x3d',
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 98,
    benchmarkScore: 18500
  },
  {
    id: 'cpu-7600x-tr',
    name: 'AMD Ryzen 5 7600X 6-Core 12-Thread Desktop Processor',
    category: 'CPU',
    brand: 'AMD',
    model: 'Ryzen 5 7600X',
    specs: { Socket: 'AM5', Cores: 6, Threads: 12, BoostClock: '5.3GHz' },
    msrp: 299.00,
    currentPrice: 199.99,
    lowestPrice90d: 194.99,
    retailer: 'Newegg',
    productUrl: 'https://www.newegg.com/amd-ryzen-5-7600x',
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    dealScore: 94,
    benchmarkScore: 14200
  },
  {
    id: 'cpu-14700k-tr',
    name: 'Intel Core i7-14700K 20-Core Unlocked Desktop Processor',
    category: 'CPU',
    brand: 'Intel',
    model: 'Core i7-14700K',
    specs: { Socket: 'LGA1700', Cores: 20, Threads: 28, BoostClock: '5.6GHz' },
    msrp: 409.99,
    currentPrice: 369.99,
    lowestPrice90d: 359.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0CGJ41V9U',
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    dealScore: 85,
    benchmarkScore: 19200
  },

  // RAM & SSDs
  {
    id: 'ram-ddr5-6000-tr',
    name: 'G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5-6000 CL30',
    category: 'RAM',
    brand: 'G.Skill',
    model: 'Trident Z5 Neo',
    specs: { Speed: '6000 MT/s', Latency: 'CL30-38-38-96', Capacity: '32GB' },
    msrp: 129.99,
    currentPrice: 99.99,
    lowestPrice90d: 94.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0BF8FVLTL',
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    dealScore: 88
  },
  {
    id: 'ssd-990pro-tr',
    name: 'Samsung 990 Pro 2TB NVMe M.2 PCIe Gen4 SSD',
    category: 'SSD',
    brand: 'Samsung',
    model: '990 Pro 2TB',
    specs: { Interface: 'PCIe 4.0 x4', ReadSpeed: '7450 MB/s' },
    msrp: 239.99,
    currentPrice: 159.99,
    lowestPrice90d: 149.99,
    retailer: 'Best Buy',
    productUrl: 'https://www.bestbuy.com/site/samsung-990-pro-2tb',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 90
  }
];

// Returns deterministic daily rotated trending components based on date seed
export function getDailyTrendingComponents(): HardwareComponent[] {
  const todayStr = new Date().toISOString().split('T')[0]; // e.g. "2026-08-06"
  const dayHash = todayStr.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);

  // Rotate items based on dayHash offset
  return HARDWARE_ROTATION_POOL.map((comp, idx) => {
    const priceFluc = (( (dayHash + idx * 7) % 15 ) - 7) * 2; // Real -14 to +14 daily variance
    const updatedPrice = Math.round(Math.max(30, comp.currentPrice + priceFluc) * 100) / 100;
    const dealScore = calculateDealScore(comp.msrp, updatedPrice, comp.lowestPrice90d);

    return {
      ...comp,
      currentPrice: updatedPrice,
      dealScore
    };
  });
}

export function getDailyTrendingWatchlist(): WatchlistItem[] {
  const trending = getDailyTrendingComponents();
  return trending.slice(0, 4).map((comp, idx) => ({
    id: `trending-w-${idx}`,
    userId: 'user-demo-123',
    componentName: comp.name,
    category: comp.category,
    targetPrice: Math.round(comp.currentPrice * 0.92),
    currentPrice: comp.currentPrice,
    previousPrice24h: Math.round(comp.currentPrice * 1.04 * 100) / 100,
    previousPrice7d: Math.round(comp.currentPrice * 1.08 * 100) / 100,
    previousPrice30d: Math.round(comp.msrp * 100) / 100,
    allTimeLow: comp.lowestPrice90d,
    retailer: comp.retailer,
    productUrl: comp.productUrl,
    imageUrl: comp.imageUrl,
    inStock: true,
    notifyOnFlashDrop: true,
    addedAt: new Date().toISOString()
  }));
}
