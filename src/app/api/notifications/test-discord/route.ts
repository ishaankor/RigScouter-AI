import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordTestWebhook, sendDiscordTargetAlertWebhook } from '@/lib/notifications/discord';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl, sampleAlert } = await req.json();

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json({ error: 'Missing webhookUrl parameter' }, { status: 400 });
    }

    let result;
    if (sampleAlert) {
      result = await sendDiscordTargetAlertWebhook({
        webhookUrl: webhookUrl.trim(),
        componentName: 'PNY GeForce RTX 5060 8GB GDDR7',
        currentPrice: 439.99,
        targetPrice: 460.00,
        retailer: 'Amazon',
        productUrl: 'https://www.amazon.com'
      });
    } else {
      result = await sendDiscordTestWebhook(webhookUrl);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to dispatch notification to Discord' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: sampleAlert
        ? '🎯 Sample price drop alert sent to your Discord channel!'
        : '✅ Test connection message sent to your Discord channel!'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

