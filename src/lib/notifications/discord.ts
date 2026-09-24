import { DailyDigestReport } from '@/lib/types/hardware';
const RIGSCOUTER_AVATAR =
  process.env.NEXT_PUBLIC_AVATAR_URL ||
  process.env.NEXT_PUBLIC_FAVICON_URL ||
  (process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/icon.png`
    : 'https://raw.githubusercontent.com/ishaankor/RigScouter-AI/main/src/app/icon.png');

/**
 * Validates that the provided string is a valid Discord webhook URL
 */
export function isValidDiscordWebhookUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_.-]+(?:\/|\?.*)?$/i.test(trimmed);
}

/**
 * Dispatches a Daily / Periodic Hardware Price Digest directly to a Discord Channel via Webhook
 */
export async function sendDiscordDigestWebhook({
  webhookUrl,
  report,
  frequency = 'daily',
  origin = 'https://rigscouter.com'
}: {
  webhookUrl: string;
  report: DailyDigestReport;
  frequency?: string;
  origin?: string;
}): Promise<{ success: boolean; status?: number; error?: string }> {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    return { success: false, error: 'Invalid Discord webhook URL' };
  }

  const freqLabel = frequency === 'weekly' ? 'Weekly Digest' :
                    frequency === 'every_3_days' ? '3-Day Digest' :
                    frequency === 'flash_only' ? 'Flash Alert' : 'Daily Digest';

  // Construct top deals / drop fields (limit to max 5 items to keep Discord embed clean)
  const embedFields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (report.biggestDrop) {
    const bd = report.biggestDrop;
    const diff = frequency === 'weekly' ? bd.change7d : bd.change24h;
    const dropAmt = Math.abs(diff?.amount || 0).toFixed(2);
    const dropPct = Math.abs(diff?.percentage || 0).toFixed(1);
    const retailer = bd.item.retailer || 'Retailer';
    const buyUrl = bd.item.productUrl && bd.item.productUrl.startsWith('http') ? bd.item.productUrl : origin;

    embedFields.push({
      name: `🔥 Top Deal Drop: ${bd.item.componentName}`,
      value: `💵 **$${Number(bd.item.currentPrice || 0).toFixed(2)}** (Save **-$${dropAmt}** / **-${dropPct}%**)\n🛒 **${retailer}** • Deal Score: **${bd.dealScore}/100**\n[🛒 View Deal on ${retailer}](${buyUrl})`,
      inline: false
    });
  }

  // Add other top watchlist items
  const otherItems = (report.items || []).filter(i => i.item.id !== report.biggestDrop?.item?.id).slice(0, 4);
  otherItems.forEach(i => {
    const diff = frequency === 'weekly' ? i.change7d : i.change24h;
    const hasDrop = diff && diff.amount < -0.01;
    const diffText = hasDrop ? ` (🔻 -$${Math.abs(diff.amount).toFixed(2)})` : '';
    const buyUrl = i.item.productUrl && i.item.productUrl.startsWith('http') ? i.item.productUrl : origin;

    embedFields.push({
      name: `${i.item.componentName}`,
      value: `**$${Number(i.item.currentPrice || 0).toFixed(2)}**${diffText} • *${i.item.retailer || 'Store'}*\n[View Product](${buyUrl})`,
      inline: true
    });
  });

  if (report.totalSavedOpportunity && report.totalSavedOpportunity > 0) {
    embedFields.push({
      name: '💰 Total Savings Scouted',
      value: `**$${Number(report.totalSavedOpportunity).toFixed(2)}** across your tracked components today.`,
      inline: false
    });
  }

  const payload = {
    username: 'RigScouter AI',
    avatar_url: RIGSCOUTER_AVATAR,
    embeds: [
      {
        title: `📢 ${report.headline}`,
        description: report.executiveSummary,
        color: 0x5865F2, // Discord Blurple
        fields: embedFields,
        footer: {
          text: `RigScouter AI • ${freqLabel} • Next automated run at 08:00 UTC`,
          icon_url: RIGSCOUTER_AVATAR
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, status: res.status, error: `Discord Webhook Error (${res.status}): ${errText}` };
    }

    return { success: true, status: res.status };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error reaching Discord' };
  }
}

/**
 * Sends a real-time instant alert to Discord when a tracked component hits its target price
 */
export async function sendDiscordTargetAlertWebhook({
  webhookUrl,
  componentName,
  currentPrice,
  targetPrice,
  retailer = 'Amazon',
  productUrl = '#',
  imageUrl
}: {
  webhookUrl: string;
  componentName: string;
  currentPrice: number;
  targetPrice: number;
  retailer?: string;
  productUrl?: string;
  imageUrl?: string;
}): Promise<{ success: boolean; status?: number; error?: string }> {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    return { success: false, error: 'Invalid Discord webhook URL' };
  }

  const diff = targetPrice - currentPrice;
  const savingsPct = targetPrice > 0 ? ((diff / targetPrice) * 100).toFixed(1) : '0';

  const embed: Record<string, any> = {
    title: `🎯 Target Price Met: ${componentName}`,
    description: `Great news! **${componentName}** is now available for **$${currentPrice.toFixed(2)}** on **${retailer}**, which is at or below your target price of **$${targetPrice.toFixed(2)}** (extra **${savingsPct}% savings**)!`,
    color: 0x10B981, // Emerald Green
    fields: [
      { name: 'Current Price', value: `**$${currentPrice.toFixed(2)}**`, inline: true },
      { name: 'Target Price', value: `**$${targetPrice.toFixed(2)}**`, inline: true },
      { name: 'Retailer', value: `**${retailer}**`, inline: true },
      { name: 'Direct Link', value: productUrl.startsWith('http') ? `[👉 Buy on ${retailer}](${productUrl})` : 'Check Retailer Listing', inline: false }
    ],
    footer: {
      text: 'RigScouter AI • Instant Flash Deal Alert',
      icon_url: RIGSCOUTER_AVATAR
    },
    timestamp: new Date().toISOString()
  };

  if (imageUrl && imageUrl.startsWith('http')) {
    embed.thumbnail = { url: imageUrl };
  }

  const payload = {
    username: 'RigScouter AI Alerts',
    avatar_url: RIGSCOUTER_AVATAR,
    embeds: [embed]
  };

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, status: res.status, error: `Discord Webhook Error (${res.status}): ${errText}` };
    }

    return { success: true, status: res.status };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error reaching Discord' };
  }
}

/**
 * Sends an immediate one-click test message to verify that the webhook is working
 */
export async function sendDiscordTestWebhook(webhookUrl: string): Promise<{ success: boolean; status?: number; error?: string }> {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    return { success: false, error: 'Invalid Discord webhook URL format. Expected: https://discord.com/api/webhooks/...' };
  }

  const payload = {
    username: 'RigScouter AI',
    avatar_url: RIGSCOUTER_AVATAR,
    embeds: [
      {
        title: '✅ RigScouter Webhook Connected!',
        description: 'Your Discord channel has been successfully linked to RigScouter AI. You will receive automated morning hardware briefings and instant price drop alerts right here.',
        color: 0x00F0FF, // Cyan
        fields: [
          { name: '🤖 Bot Status', value: 'Active & Listening', inline: true },
          { name: '⏰ Next Scheduled Run', value: '08:00 AM UTC', inline: true }
        ],
        footer: {
          text: 'RigScouter AI • Real-Time PC Hardware Tracker',
          icon_url: RIGSCOUTER_AVATAR
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, status: res.status, error: `Discord responded with ${res.status}: ${errText}` };
    }

    return { success: true, status: res.status };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to dispatch test message to Discord' };
  }
}
