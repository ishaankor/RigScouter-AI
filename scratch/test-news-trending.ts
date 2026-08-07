import { fetchTrendingHardwareFromNews } from '../src/lib/scrapers/trending-engine';
import dotenv from 'dotenv';

dotenv.config();

async function testNewsTrending() {
  console.log('📰 Testing Autonomous News Trending PC Hardware Discovery Engine...\n');

  const components = await fetchTrendingHardwareFromNews();

  console.log(`\n✅ Total Components Returned from DB/News: ${components.length}\n`);
  for (const c of components) {
    console.log(`  [${c.category.padEnd(8)}] ${c.name.substring(0, 60).padEnd(60)} | $${c.currentPrice.toFixed(2).padStart(8)} @ ${c.retailer}`);
  }
}

testNewsTrending().catch(console.error);
