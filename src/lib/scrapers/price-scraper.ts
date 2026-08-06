import { HardwareComponent, WatchlistItem, RetailerName, ComponentCategory } from '../types/hardware';

// Verified Hardware Catalog across major retailers with exact 2026 market prices & benchmark scores
export const MOCK_HARDWARE_CATALOG: HardwareComponent[] = [
  // GPUs
  {
    id: 'gpu-4070-super-1',
    name: 'ASUS Dual GeForce RTX 4070 Super OC Edition 12GB',
    category: 'GPU',
    brand: 'ASUS',
    model: 'RTX 4070 Super',
    specs: { VRAM: '12GB GDDR6X', TDP: '220W', Length: '267mm', RecommendedPSU: '650W' },
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
    id: 'gpu-4080-super-1',
    name: 'GIGABYTE GeForce RTX 4080 Super GAMING OC 16GB',
    category: 'GPU',
    brand: 'GIGABYTE',
    model: 'RTX 4080 Super',
    specs: { VRAM: '16GB GDDR6X', TDP: '320W', Length: '342mm', RecommendedPSU: '750W' },
    msrp: 999.99,
    currentPrice: 969.99,
    lowestPrice90d: 949.99,
    retailer: 'Newegg',
    productUrl: 'https://www.newegg.com/gigabyte-geforce-rtx-4080-super',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 86,
    benchmarkScore: 19800
  },
  {
    id: 'gpu-4060-1',
    name: 'MSI GeForce RTX 4060 Ventus 2X Black 8GB OC',
    category: 'GPU',
    brand: 'MSI',
    model: 'RTX 4060',
    specs: { VRAM: '8GB GDDR6', TDP: '115W', Length: '199mm', RecommendedPSU: '550W' },
    msrp: 299.99,
    currentPrice: 289.99,
    lowestPrice90d: 279.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0C8K2M19P',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    dealScore: 80,
    benchmarkScore: 8900
  },
  {
    id: 'gpu-7800-xt-1',
    name: 'Sapphire PULSE AMD Radeon RX 7800 XT 16GB',
    category: 'GPU',
    brand: 'Sapphire',
    model: 'RX 7800 XT',
    specs: { VRAM: '16GB GDDR6', TDP: '263W', Length: '280mm', RecommendedPSU: '700W' },
    msrp: 499.99,
    currentPrice: 479.99,
    lowestPrice90d: 469.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0CGGP7WCG',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    dealScore: 88,
    benchmarkScore: 13900
  },

  // CPUs
  {
    id: 'cpu-7800x3d-1',
    name: 'AMD Ryzen 7 7800X3D 8-Core 16-Thread Desktop Processor',
    category: 'CPU',
    brand: 'AMD',
    model: 'Ryzen 7 7800X3D',
    specs: { Socket: 'AM5', Cores: 8, Threads: 16, BaseClock: '4.2GHz', BoostClock: '5.0GHz', TDP: '120W' },
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
    id: 'cpu-7600x-1',
    name: 'AMD Ryzen 5 7600X 6-Core 12-Thread Desktop Processor',
    category: 'CPU',
    brand: 'AMD',
    model: 'Ryzen 5 7600X',
    specs: { Socket: 'AM5', Cores: 6, Threads: 12, BaseClock: '4.7GHz', BoostClock: '5.3GHz', TDP: '105W' },
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
    id: 'cpu-14700k-1',
    name: 'Intel Core i7-14700K 20-Core (8P+12E) Unlocked Processor',
    category: 'CPU',
    brand: 'Intel',
    model: 'Core i7-14700K',
    specs: { Socket: 'LGA1700', Cores: 20, Threads: 28, BoostClock: '5.6GHz', TDP: '125W' },
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

  // RAM
  {
    id: 'ram-ddr5-6000-1',
    name: 'G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5-6000 CL30',
    category: 'RAM',
    brand: 'G.Skill',
    model: 'Trident Z5 Neo',
    specs: { Speed: '6000 MT/s', Latency: 'CL30-38-38-96', Capacity: '32GB (2x16GB)', Voltage: '1.35V' },
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
    id: 'ram-ddr5-vengeance-1',
    name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5-6000 CL30 AMD Expo',
    category: 'RAM',
    brand: 'Corsair',
    model: 'Vengeance RGB',
    specs: { Speed: '6000 MT/s', Latency: 'CL30', Capacity: '32GB (2x16GB)' },
    msrp: 134.99,
    currentPrice: 104.99,
    lowestPrice90d: 99.99,
    retailer: 'Best Buy',
    productUrl: 'https://www.bestbuy.com/site/corsair-vengeance-32gb-ddr5',
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    dealScore: 84
  },

  // SSDs
  {
    id: 'ssd-990-pro-1',
    name: 'Samsung 990 Pro 2TB NVMe M.2 PCIe Gen4 SSD',
    category: 'SSD',
    brand: 'Samsung',
    model: '990 Pro 2TB',
    specs: { Interface: 'PCIe 4.0 x4', ReadSpeed: '7450 MB/s', WriteSpeed: '6900 MB/s', FormFactor: 'M.2 2280' },
    msrp: 239.99,
    currentPrice: 159.99,
    lowestPrice90d: 149.99,
    retailer: 'Best Buy',
    productUrl: 'https://www.bestbuy.com/site/samsung-990-pro-2tb',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 90
  },
  {
    id: 'ssd-sn850x-1',
    name: 'WD_BLACK SN850X 2TB NVMe M.2 PCIe Gen4 SSD',
    category: 'SSD',
    brand: 'Western Digital',
    model: 'SN850X 2TB',
    specs: { Interface: 'PCIe 4.0 x4', ReadSpeed: '7300 MB/s', Capacity: '2TB' },
    msrp: 199.99,
    currentPrice: 139.99,
    lowestPrice90d: 134.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0B7CMZ3SG',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 92
  },

  // Motherboards
  {
    id: 'mobo-b650-1',
    name: 'MSI MAG B650 Tomahawk WiFi AM5 ATX Motherboard',
    category: 'Motherboard',
    brand: 'MSI',
    model: 'MAG B650 Tomahawk',
    specs: { Socket: 'AM5', FormFactor: 'ATX', RAMSlots: 4, WiFi: 'WiFi 6E', PCIe: 'PCIe 4.0' },
    msrp: 219.99,
    currentPrice: 189.99,
    lowestPrice90d: 179.99,
    retailer: 'Newegg',
    productUrl: 'https://www.newegg.com/msi-mag-b650-tomahawk-wifi',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    dealScore: 84
  },
  {
    id: 'mobo-b650-micro-1',
    name: 'GIGABYTE B650 AORUS Elite AX AM5 ATX Motherboard',
    category: 'Motherboard',
    brand: 'GIGABYTE',
    model: 'B650 AORUS Elite',
    specs: { Socket: 'AM5', FormFactor: 'ATX', WiFi: 'WiFi 6E' },
    msrp: 229.99,
    currentPrice: 199.99,
    lowestPrice90d: 189.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0BHACCXYL',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    dealScore: 82
  },

  // PSUs
  {
    id: 'psu-rm850x-1',
    name: 'Corsair RM850x 850W 80+ Gold Fully Modular Power Supply',
    category: 'PSU',
    brand: 'Corsair',
    model: 'RM850x',
    specs: { Wattage: '850W', Rating: '80+ Gold', Modular: 'Fully Modular', Warranty: '10 Years' },
    msrp: 149.99,
    currentPrice: 119.99,
    lowestPrice90d: 114.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B08R5JPTMZ',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 89
  },
  {
    id: 'psu-seasonic-750-1',
    name: 'Seasonic FOCUS GX-750 750W 80+ Gold Fully Modular PSU',
    category: 'PSU',
    brand: 'Seasonic',
    model: 'FOCUS GX-750',
    specs: { Wattage: '750W', Rating: '80+ Gold', Modular: 'Fully Modular' },
    msrp: 129.99,
    currentPrice: 99.99,
    lowestPrice90d: 94.99,
    retailer: 'Newegg',
    productUrl: 'https://www.newegg.com/seasonic-focus-gx-750',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    dealScore: 87
  },

  // Cases
  {
    id: 'case-h6-flow-1',
    name: 'NZXT H6 Flow Compact Dual-Chamber Mid-Tower Airflow Case',
    category: 'Case',
    brand: 'NZXT',
    model: 'H6 Flow',
    specs: { FormFactor: 'Mid-Tower', SidePanel: 'Tempered Glass', IncludedFans: 3 },
    msrp: 109.99,
    currentPrice: 94.99,
    lowestPrice90d: 89.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0C89F3GMB',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    dealScore: 85
  },

  // Coolers
  {
    id: 'cooler-peerless-1',
    name: 'Thermalright Peerless Assassin 120 SE Dual-Tower CPU Cooler',
    category: 'Cooler',
    brand: 'Thermalright',
    model: 'Peerless Assassin 120 SE',
    specs: { Type: 'Air Cooler', Heatpipes: 6, Fans: 2, Height: '155mm' },
    msrp: 45.90,
    currentPrice: 33.90,
    lowestPrice90d: 32.90,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B09LGY38L4',
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    dealScore: 96
  }
];

export const MOCK_INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    id: 'w1',
    userId: 'user-demo-123',
    componentName: 'AMD Ryzen 7 7800X3D Desktop Processor',
    category: 'CPU',
    targetPrice: 350.00,
    currentPrice: 339.00,
    previousPrice24h: 384.00,
    previousPrice7d: 384.00,
    previousPrice30d: 399.00,
    allTimeLow: 339.00,
    retailer: 'Micro Center',
    productUrl: 'https://www.microcenter.com/product/663663/amd-ryzen-7-7800x3d',
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    notifyOnFlashDrop: true,
    addedAt: '2026-07-20T10:00:00Z'
  },
  {
    id: 'w2',
    userId: 'user-demo-123',
    componentName: 'ASUS Dual GeForce RTX 4070 Super OC 12GB',
    category: 'GPU',
    targetPrice: 550.00,
    currentPrice: 549.99,
    previousPrice24h: 569.99,
    previousPrice7d: 579.99,
    previousPrice30d: 599.99,
    allTimeLow: 539.99,
    retailer: 'Amazon',
    productUrl: 'https://www.amazon.com/dp/B0CS9WGLH7',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    notifyOnFlashDrop: true,
    addedAt: '2026-07-22T14:30:00Z'
  },
  {
    id: 'w3',
    userId: 'user-demo-123',
    componentName: 'Samsung 990 Pro 2TB M.2 PCIe Gen4 NVMe SSD',
    category: 'SSD',
    targetPrice: 145.00,
    currentPrice: 159.99,
    previousPrice24h: 159.99,
    previousPrice7d: 169.99,
    previousPrice30d: 169.99,
    allTimeLow: 149.99,
    retailer: 'Best Buy',
    productUrl: 'https://www.bestbuy.com/site/samsung-990-pro-2tb',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    notifyOnFlashDrop: true,
    addedAt: '2026-07-25T09:15:00Z'
  },
  {
    id: 'w4',
    userId: 'user-demo-123',
    componentName: 'G.Skill Trident Z5 Neo RGB 32GB DDR5-6000 CL30',
    category: 'RAM',
    targetPrice: 95.00,
    currentPrice: 99.99,
    previousPrice24h: 94.99,
    previousPrice7d: 94.99,
    previousPrice30d: 104.99,
    allTimeLow: 94.99,
    retailer: 'Newegg',
    productUrl: 'https://www.newegg.com/g-skill-32gb-ddr5-6000',
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    notifyOnFlashDrop: false,
    addedAt: '2026-07-28T16:00:00Z'
  }
];

export function calculateDealScore(msrp: number, currentPrice: number, lowest90d: number): number {
  if (msrp <= 0) return 50;
  const discountFromMSRP = ((msrp - currentPrice) / msrp) * 100;
  const distanceToLowest = Math.max(0, currentPrice - lowest90d);
  
  let score = 50 + discountFromMSRP * 1.5;
  if (distanceToLowest === 0) {
    score += 20; // Hit lowest price in 90 days!
  } else if (distanceToLowest < 10) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
}
