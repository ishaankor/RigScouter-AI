import { WatchlistItem, DigestItemSummary, DailyDigestReport, DigestFrequency, ComparisonInterval } from '../types/hardware';
import Groq from 'groq-sdk';

export function cleanDisplayTitle(name: string): string {
  if (!name) return 'Hardware Component';
  let firstPart = name.split(/\s+-\s+|\s+—\s+|\s+\|\s+/)[0].trim();
  firstPart = firstPart.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (firstPart.length < 15 && name.length > firstPart.length) {
    firstPart = name.slice(0, 65).replace(/[, -]+$/, '') + '...';
  }
  return firstPart;
}

export async function generateDailyDigestReport(
  watchlist: WatchlistItem[],
  frequency: DigestFrequency = 'daily',
  intervals: ComparisonInterval[] = ['24h', '7d', '30d', 'ATL']
): Promise<DailyDigestReport> {
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

    // Calculate savings opportunity based on frequency horizon
    if (frequency === 'weekly') {
      if (change7dAmount < 0) totalSavedOpportunity += Math.abs(change7dAmount);
    } else if (frequency === 'every_3_days') {
      // 3-day approximation using primary recent dip
      const drop = change24hAmount < change7dAmount ? change24hAmount : change7dAmount;
      if (drop < 0) totalSavedOpportunity += Math.abs(drop);
    } else if (frequency === 'flash_only') {
      if (isATL || change24hAmount < -15) {
        totalSavedOpportunity += Math.abs(change24hAmount < 0 ? change24hAmount : (item.targetPrice - item.currentPrice));
      }
    } else {
      // Daily
      if (change24hAmount < 0) totalSavedOpportunity += Math.abs(change24hAmount);
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
    else if (change24hAmount < -20 || change7dAmount < -30) dealScore = 90;
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

  // Determine biggest drop relevant to the chosen frequency
  let biggestDrop: DigestItemSummary | null = null;
  if (frequency === 'weekly') {
    biggestDrop = [...itemSummaries].sort((a, b) => a.change7d.amount - b.change7d.amount)[0] || null;
  } else if (frequency === 'flash_only') {
    const flashDeals = itemSummaries.filter(i => i.isAllTimeLow || i.change24h.amount < -15);
    biggestDrop = (flashDeals.length > 0 ? flashDeals : itemSummaries).sort((a, b) => a.change24h.amount - b.change24h.amount)[0] || null;
  } else {
    biggestDrop = [...itemSummaries].sort((a, b) => a.change24h.amount - b.change24h.amount)[0] || null;
  }

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Frequency-tailored headlines and summaries
  let headline = `Daily Hardware Briefing (${todayStr})`;
  let executiveSummary = '';

  const cleanBiggestName = biggestDrop ? cleanDisplayTitle(biggestDrop.item.componentName || '') : '';

  if (frequency === 'weekly') {
    headline = `Weekly Hardware Digest (${todayStr})`;
    if (biggestDrop && biggestDrop.change7d.amount < 0) {
      headline = `📉 ${cleanBiggestName} dropped $${Math.abs(biggestDrop.change7d.amount).toFixed(2)} this week to $${Number(biggestDrop.item.currentPrice).toFixed(2)}`;
    }
    const drops7d = itemSummaries.filter(i => (i.change7d?.amount || 0) < 0).length;
    executiveSummary = `Weekly Watchlist Roundup: ${watchlist.length} tracked item(s) monitored. We observed ${drops7d} component(s) decrease in price over the past 7 days. ${
      biggestDrop && biggestDrop.isAllTimeLow ? `Notably, the ${cleanBiggestName} reached a 90-day All-Time Low of $${Number(biggestDrop.item.currentPrice || 0).toFixed(2)} on ${biggestDrop.item.retailer}.` : ''
    }`;
  } else if (frequency === 'every_3_days') {
    headline = `3-Day Market Briefing (${todayStr})`;
    const dropAmt = biggestDrop ? (biggestDrop.change24h.amount < 0 ? biggestDrop.change24h.amount : biggestDrop.change7d.amount) : 0;
    if (biggestDrop && dropAmt < 0) {
      headline = `📉 ${cleanBiggestName} dropped $${Math.abs(dropAmt).toFixed(2)} to $${Number(biggestDrop.item.currentPrice).toFixed(2)}`;
    }
    executiveSummary = `3-Day Market Momentum: Monitoring ${watchlist.length} hardware component(s). We identified ${
      itemSummaries.filter(i => (i.change24h?.amount || 0) < 0 || (i.change7d?.amount || 0) < 0).length
    } price adjustment(s) across retailers in the last 72 hours.`;
  } else if (frequency === 'flash_only') {
    headline = `⚡ Flash Deal Alert (${todayStr})`;
    if (biggestDrop && (biggestDrop.isAllTimeLow || biggestDrop.change24h.amount < 0)) {
      headline = `🔥 Flash Drop: ${cleanBiggestName} hits $${Number(biggestDrop.item.currentPrice).toFixed(2)}${biggestDrop.isAllTimeLow ? ' (90D Low)' : ''}`;
    }
    const flashCount = itemSummaries.filter(i => i.isAllTimeLow || (i.change24h?.amount || 0) < 0).length;
    executiveSummary = `High-Priority Deal Alert: ${flashCount} critical price drop(s) or 90-day All-Time Lows detected across your personal hardware watchlist.`;
  } else {
    // Daily
    if (biggestDrop && biggestDrop.change24h.amount < 0) {
      headline = `📉 ${cleanBiggestName} dropped $${Math.abs(biggestDrop.change24h.amount).toFixed(2)} to $${Number(biggestDrop.item.currentPrice).toFixed(2)}`;
    }
    executiveSummary = `Your tracked watchlist has ${watchlist.length} active item(s). We detected ${
      itemSummaries.filter(i => (i.change24h?.amount || 0) < 0).length
    } price drop(s) in the last 24 hours. ${
      biggestDrop && biggestDrop.isAllTimeLow ? `The ${cleanBiggestName} reached a 90-day low of $${Number(biggestDrop.item.currentPrice || 0).toFixed(2)} on ${biggestDrop.item.retailer}.` : ''
    }`;
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey && watchlist.length > 0) {
    try {
      const groq = new Groq({ apiKey: groqApiKey });
      const frequencyLabel = frequency === 'weekly' ? 'Weekly 7-Day Digest' : frequency === 'every_3_days' ? '3-Day Market Digest' : frequency === 'flash_only' ? 'Flash Deal Alert' : 'Daily 24h Briefing';
      
      const prompt = `You are RigScouter AI, a precise, data-driven PC hardware market intelligence analyst.
Analyze the user's tracked hardware watchlist for a "${frequencyLabel}" and generate:
1. "headline": A crisp, professional headline summarizing the most significant price movement or market state for this timeframe (max 1 emoji like 📉 or ⚡ or 🔥, use concise model names like "RTX 4080 Super" instead of long SEO strings).
2. "executiveSummary": A concise 2-3 sentence executive summary providing concrete hardware market insights for this ${frequencyLabel} timeframe: mention the exact models, retailers, price movements, and whether components are at a 90-day All-Time Low. Strictly avoid marketing fluff, hype words ("beast", "powerhouse", "hottest", "grab it now"), or generic filler. Focus on actionable pricing intelligence for a PC builder.

Return a SINGLE JSON object with keys "headline" and "executiveSummary".
Watchlist Data: ${JSON.stringify(itemSummaries.map(i => ({
  model: cleanDisplayTitle(i.item.componentName || ''),
  category: i.item.category,
  retailer: i.item.retailer,
  currentPrice: i.item.currentPrice,
  previousPrice24h: i.item.previousPrice24h,
  previousPrice7d: i.item.previousPrice7d,
  previousPrice30d: i.item.previousPrice30d,
  drop24h: i.change24h.amount,
  drop7d: i.change7d.amount,
  drop30d: i.change30d.amount,
  isATL: i.isAllTimeLow
})))}`;
      
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
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

  const validDrop = frequency === 'weekly' 
    ? (biggestDrop && biggestDrop.change7d.amount < 0 ? biggestDrop : null)
    : (biggestDrop && biggestDrop.change24h.amount < 0 ? biggestDrop : null);

  return {
    id: `digest-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    headline,
    executiveSummary,
    biggestDrop: validDrop,
    items: itemSummaries,
    totalSavedOpportunity: Math.round(totalSavedOpportunity * 100) / 100,
    frequency,
    comparisonIntervals: intervals
  };
}

