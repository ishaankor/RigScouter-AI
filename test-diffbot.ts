import { scrapeTavilyAndSaveToDb } from './src/lib/scrapers/tavily-scraper';

async function runTest() {
  const neweggUrl = "https://www.newegg.com/msi-geforce-rtx-4070-super-12g-ventus-2x-oc/p/N82E16814137859";
  const bestbuyUrl = "https://www.bestbuy.com/site/nvidia-geforce-rtx-4070-super-12gb-gddr6x-graphics-card-titanium-black/6570226.p";
  
  console.log(`Testing Newegg URL...`);
  try {
    const result = await scrapeTavilyAndSaveToDb(neweggUrl);
    console.log("Newegg Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Newegg Test failed:", error);
  }

  console.log(`\nTesting BestBuy URL...`);
  try {
    const result = await scrapeTavilyAndSaveToDb(bestbuyUrl);
    console.log("BestBuy Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("BestBuy Test failed:", error);
  }
}

runTest();
