import { WatchlistItem, DigestItemSummary, DailyDigestReport } from '../types/hardware';
import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function generateDailyDigestReport(watchlist: WatchlistItem[]): Promise<DailyDigestReport> {
  let totalSavedOpportunity = 0;

  const itemSummaries: DigestItemSummary[] = watchlist.map(item => {
    const change24hAmount = item.currentPrice - item.previousPrice24h;
    const change24hPercent = item.previousPrice24h > 0 
      ? (change24hAmount / item.previousPrice24h) * 100 
      : 0;

    const change7dAmount = item.currentPrice - item.previousPrice7d;
    const change7dPercent = item.previousPrice7d > 0 
      ? (change7dAmount / item.previousPrice7d) * 100 
      : 0;

    const change30dAmount = item.currentPrice - item.previousPrice30d;
    const change30dPercent = item.previousPrice30d > 0 
      ? (change30dAmount / item.previousPrice30d) * 100 
      : 0;

    const isATL = item.currentPrice <= item.allTimeLow;

    if (change24hAmount < 0) {
      totalSavedOpportunity += Math.abs(change24hAmount);
    }

    // Evaluate potential alternative recommendations
    let alternativePick;
    if (item.category === 'SSD' && item.currentPrice > 150) {
      alternativePick = {
        name: 'WD_BLACK SN850X 2TB NVMe SSD',
        price: 139.99,
        savings: item.currentPrice - 139.99,
        reason: 'Identical Gen4 7300MB/s speeds for $20 less today on Amazon.',
        url: 'https://www.amazon.com/dp/B0B7CMZ3SG'
      };
    }

    // Simple deal score calculation
    let dealScore = 60;
    if (isATL) dealScore = 98;
    else if (change24hAmount < -20) dealScore = 90;
    else if (change7dAmount < 0) dealScore = 80;

    return {
      item,
      change24h: { amount: Math.round(change24hAmount * 100) / 100, percentage: Math.round(change24hPercent * 10) / 10 },
      change7d: { amount: Math.round(change7dAmount * 100) / 100, percentage: Math.round(change7dPercent * 10) / 10 },
      change30d: { amount: Math.round(change30dAmount * 100) / 100, percentage: Math.round(change30dPercent * 10) / 10 },
      isAllTimeLow: isATL,
      dealScore,
      alternativePick
    };
  });

  // Find biggest price drop
  const biggestDrop = [...itemSummaries].sort((a, b) => a.change24h.amount - b.change24h.amount)[0] || null;

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  let headline = `RigScouter Daily Digest (${todayStr})`;
  if (biggestDrop && biggestDrop.change24h.amount < 0) {
    headline = `🔥 ${biggestDrop.item.componentName.split(' ')[0]} ${biggestDrop.item.componentName.split(' ')[1]} dropped $${Math.abs(biggestDrop.change24h.amount)} today!`;
  }

  const executiveSummary = `Your tracked watchlist currently has ${watchlist.length} active items. We detected ${
    itemSummaries.filter(i => i.change24h.amount < 0).length
  } price drop(s) in the last 24 hours. ${
    biggestDrop && biggestDrop.isAllTimeLow ? `The ${biggestDrop.item.componentName} just hit a 90-day All-Time Low at $${biggestDrop.item.currentPrice.toFixed(2)}.` : ''
  }`;

  if (groq && watchlist.length > 0) {
    try {
      const prompt = `You are RigScouter, an expert PC hardware deal-hunter AI.
Given the following user watchlist with price drop data, write a personalized email headline and a 1-2 paragraph executive summary.
Keep it punchy, hype-driven, and highlight the best deals.
Return a SINGLE valid JSON object ONLY (not an array) with the exact format {"headline": "...", "executiveSummary": "..."}.
Watchlist Data: ${JSON.stringify(itemSummaries.map(i => ({ name: i.item.componentName, price: i.item.currentPrice, drop24h: i.change24h.amount, isATL: i.isAllTimeLow })))}
      `;
      
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        let parsed = JSON.parse(content);
        if (Array.isArray(parsed)) parsed = parsed[0];
        
        if (parsed?.headline) headline = parsed.headline;
        if (parsed?.executiveSummary) executiveSummary = parsed.executiveSummary;
      }
    } catch (e) {
      console.error("Groq generation failed:", e);
    }
  }

  return {
    id: `digest-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    headline,
    executiveSummary,
    biggestDrop: biggestDrop && biggestDrop.change24h.amount < 0 ? biggestDrop : null,
    items: itemSummaries,
    totalSavedOpportunity: Math.round(totalSavedOpportunity * 100) / 100
  };
}
