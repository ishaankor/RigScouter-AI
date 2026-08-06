import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfzokxffhmedvtuhykdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mem9reGZmaG1lZHZ0dWh5a2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjY1NjIsImV4cCI6MjEwMTU0MjU2Mn0.pkKw3G6EbD0A3cUydWPA79WE07RJElQdWkRcQXjkUoQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const REAL_COMPONENTS = [
  {
    id: 'gpu-4070-super-real',
    name: 'ASUS Dual GeForce RTX 4070 Super OC Edition 12GB',
    category: 'GPU',
    brand: 'ASUS',
    model: 'RTX 4070 Super',
    specs: JSON.stringify({ VRAM: '12GB GDDR6X', TDP: '220W', Length: '267mm' }),
    msrp: 599.99,
    current_price: 549.99,
    lowest_price_90d: 539.99,
    retailer: 'Micro Center',
    product_url: 'https://www.microcenter.com/product/676345/asus-nvidia-geforce-rtx-4070-super',
    image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    deal_score: 92,
    benchmark_score: 14200,
    updated_at: new Date().toISOString()
  },
  {
    id: 'cpu-7800x3d-real',
    name: 'AMD Ryzen 7 7800X3D 8-Core 16-Thread Desktop Processor',
    category: 'CPU',
    brand: 'AMD',
    model: 'Ryzen 7 7800X3D',
    specs: JSON.stringify({ Socket: 'AM5', Cores: 8, Threads: 16, BoostClock: '5.0GHz' }),
    msrp: 449.00,
    current_price: 339.00,
    lowest_price_90d: 339.00,
    retailer: 'Micro Center',
    product_url: 'https://www.microcenter.com/product/663663/amd-ryzen-7-7800x3d',
    image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    deal_score: 98,
    benchmark_score: 18500,
    updated_at: new Date().toISOString()
  },
  {
    id: 'ram-ddr5-6000-real',
    name: 'G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5-6000 CL30',
    category: 'RAM',
    brand: 'G.Skill',
    model: 'Trident Z5 Neo',
    specs: JSON.stringify({ Speed: '6000 MT/s', Latency: 'CL30-38-38-96', Capacity: '32GB' }),
    msrp: 129.99,
    current_price: 99.99,
    lowest_price_90d: 94.99,
    retailer: 'Amazon',
    product_url: 'https://www.amazon.com/dp/B0BF8FVLTL',
    image_url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    deal_score: 88,
    updated_at: new Date().toISOString()
  },
  {
    id: 'ssd-990-pro-real',
    name: 'Samsung 990 Pro 2TB NVMe M.2 PCIe Gen4 SSD',
    category: 'SSD',
    brand: 'Samsung',
    model: '990 Pro 2TB',
    specs: JSON.stringify({ Interface: 'PCIe 4.0 x4', ReadSpeed: '7450 MB/s' }),
    msrp: 239.99,
    current_price: 159.99,
    lowest_price_90d: 149.99,
    retailer: 'Best Buy',
    product_url: 'https://www.bestbuy.com/site/samsung-990-pro-2tb',
    image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    deal_score: 90,
    updated_at: new Date().toISOString()
  }
];

const REAL_WATCHLIST = [
  {
    id: 'w1-real',
    user_id: 'user-demo-123',
    component_name: 'AMD Ryzen 7 7800X3D Desktop Processor',
    category: 'CPU',
    target_price: 350.00,
    current_price: 339.00,
    previous_price_24h: 384.00,
    previous_price_7d: 384.00,
    previous_price_30d: 399.00,
    all_time_low: 339.00,
    retailer: 'Micro Center',
    product_url: 'https://www.microcenter.com/product/663663/amd-ryzen-7-7800x3d',
    image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    in_stock: true,
    notify_on_flash_drop: true,
    added_at: new Date().toISOString()
  },
  {
    id: 'w2-real',
    user_id: 'user-demo-123',
    component_name: 'ASUS Dual GeForce RTX 4070 Super OC 12GB',
    category: 'GPU',
    target_price: 550.00,
    current_price: 549.99,
    previous_price_24h: 569.99,
    previous_price_7d: 579.99,
    previous_price_30d: 599.99,
    all_time_low: 539.99,
    retailer: 'Amazon',
    product_url: 'https://www.amazon.com/dp/B0CS9WGLH7',
    image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    in_stock: true,
    notify_on_flash_drop: true,
    added_at: new Date().toISOString()
  }
];

async function seed() {
  console.log('Seeding Supabase PostgreSQL database with real hardware components...');
  const { error: compErr } = await supabase.from('hardware_components').upsert(REAL_COMPONENTS);
  if (compErr) console.error('Error seeding hardware_components:', compErr);
  else console.log('Successfully seeded hardware_components table!');

  const { error: watchErr } = await supabase.from('watchlist_items').upsert(REAL_WATCHLIST);
  if (watchErr) console.error('Error seeding watchlist_items:', watchErr);
  else console.log('Successfully seeded watchlist_items table!');
}

seed();
