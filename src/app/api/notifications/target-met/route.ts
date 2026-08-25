import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export const runtime = 'edge';

// In-memory cooldown cache per Edge instance (5-min throttle per user+component)
const sentAlertsCooldown = new Map<string, number>();

async function sendResendEmail({ from, to, subject, html }: { from: string; to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('No RESEND_API_KEY set in environment');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errText}`);
  }
  return await res.json();
}

function getRetailerBadgeStyle(retailer: string): { bg: string; color: string; border: string } {
  const r = (retailer || '').toLowerCase();
  if (r.includes('amazon')) return { bg: '#232f3e', color: '#ff9900', border: '#ff990055' };
  if (r.includes('newegg')) return { bg: '#1c2237', color: '#fbbf24', border: '#fbbf2455' };
  if (r.includes('micro')) return { bg: '#311019', color: '#fb7185', border: '#fb718555' };
  if (r.includes('b&h') || r.includes('bh')) return { bg: '#082f49', color: '#38bdf8', border: '#38bdf855' };
  if (r.includes('ebay')) return { bg: '#064e3b', color: '#34d399', border: '#34d39955' };
  return { bg: '#1f2937', color: '#9ca3af', border: '#374151' };
}

function buildTargetMetEmailHtml({
  componentName,
  category = 'GPU',
  targetPrice,
  currentPrice,
  retailer = 'Amazon',
  productUrl = '#',
  imageUrl
}: {
  componentName: string;
  category?: string;
  targetPrice: number;
  currentPrice: number;
  retailer: string;
  productUrl: string;
  imageUrl?: string;
}): string {
  const rBadge = getRetailerBadgeStyle(retailer);
  const diff = targetPrice - currentPrice;
  const savingsPct = targetPrice > 0 ? ((diff / targetPrice) * 100).toFixed(1) : '0';
  const directBuyUrl = productUrl && productUrl.startsWith('http') 
    ? productUrl 
    : `https://www.google.com/search?q=${encodeURIComponent(componentName + ' ' + retailer)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Target Price Alert: ${componentName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px; background-color: #020617;">
    
    <!-- Top Header -->
    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #1e293b;">
      <div style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
        RigScouter AI
      </div>
      <div style="font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">
        🎯 Instant Target Alert Notification
      </div>
    </div>

    <!-- Main Alert Card -->
    <div style="background-color: #0f172a; border: 1px solid #10b98155; border-radius: 16px; padding: 24px; box-shadow: 0 8px 30px rgba(16, 185, 129, 0.15); margin-bottom: 20px;">
      
      <!-- Top Badges -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td>
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #10b981; background: #064e3b; padding: 4px 10px; border-radius: 6px; border: 1px solid #059669;">
              🎯 TARGET PRICE MET
            </span>
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #38bdf8; background: #0c4a6e; padding: 4px 8px; border-radius: 6px; margin-left: 6px; border: 1px solid #0284c755;">
              ${category}
            </span>
          </td>
          <td style="text-align: right;">
            <span style="font-size: 12px; font-weight: 700; color: ${rBadge.color}; background: ${rBadge.bg}; border: 1px solid ${rBadge.border}; padding: 4px 10px; border-radius: 6px;">
              ${retailer}
            </span>
          </td>
        </tr>
      </table>

      <!-- Product Title -->
      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 800; color: #f8fafc; line-height: 1.4;">
        ${componentName}
      </h2>

      <!-- Price Comparison Box -->
      <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; border-right: 1px solid #1e293b; padding-right: 14px;">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Current Live Price</div>
              <div style="font-size: 26px; font-weight: 900; color: #10b981; margin-top: 4px;">
                $${currentPrice.toFixed(2)}
              </div>
              <div style="font-size: 11px; color: #34d399; font-weight: 700; margin-top: 2px;">
                ${diff > 0 ? `✓ $${diff.toFixed(2)} (${savingsPct}%) under target!` : '✓ Exactly at target price!'}
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 14px;">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Your Target Alert</div>
              <div style="font-size: 22px; font-weight: 800; color: #cbd5e1; margin-top: 6px;">
                $${targetPrice.toFixed(2)}
              </div>
              <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">
                Stock: In Stock
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center;">
        <a href="${directBuyUrl}" target="_blank" style="display: block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); letter-spacing: 0.3px;">
          ⚡ Buy Now at ${retailer} for $${currentPrice.toFixed(2)} &rarr;
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; font-size: 11px; color: #64748b; padding-top: 12px;">
      <p style="margin: 0 0 6px 0;">
        You received this automated notification because flash drop alerts are enabled on your RigScouter Watchlist.
      </p>
      <p style="margin: 0;">
        &copy; ${new Date().getFullYear()} RigScouter AI. Real-time Multi-Retailer Hardware Engine.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      userEmail,
      componentName,
      category = 'GPU',
      targetPrice,
      currentPrice,
      retailer = 'Amazon',
      productUrl = '#',
      imageUrl,
      force = false
    } = body;

    if (!componentName || typeof targetPrice !== 'number' || typeof currentPrice !== 'number') {
      return NextResponse.json({ error: 'componentName, targetPrice, and currentPrice are required' }, { status: 400 });
    }

    // Resolve target email address
    let recipientEmail = userEmail;
    if (!recipientEmail && userId) {
      try {
        const { data: pref } = await supabaseAdmin
          .from('user_preferences')
          .select('email')
          .eq('user_id', userId)
          .single();
        if (pref?.email) recipientEmail = pref.email;
      } catch (e) {}
    }

    if (!recipientEmail) {
      recipientEmail = process.env.ADMIN_ALERT_EMAIL || 'ishaankor@gmail.com';
    }

    // Cooldown check (5-min throttle per email + componentName to prevent multi-click email bursts)
    const cooldownKey = `${recipientEmail}:${componentName.toLowerCase().slice(0, 20)}`;
    const now = Date.now();
    const lastSent = sentAlertsCooldown.get(cooldownKey) || 0;
    if (!force && now - lastSent < 5 * 60 * 1000) {
      return NextResponse.json({
        success: true,
        message: 'Notification skipped due to 5-minute alert cooldown for this component.',
        throttled: true
      });
    }

    const html = buildTargetMetEmailHtml({
      componentName,
      category,
      targetPrice,
      currentPrice,
      retailer,
      productUrl,
      imageUrl
    });

    const senderDomain = process.env.RESEND_DOMAIN || 'rigscouter@ishaankoradia.com';
    const fromAddress = process.env.RESEND_FROM_EMAIL || `RigScouter Alerts <${senderDomain}>`;
    const subject = `🎯 Target Price Met! ${componentName} is $${currentPrice.toFixed(2)} at ${retailer}`;

    const resendResult = await sendResendEmail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      html
    });

    sentAlertsCooldown.set(cooldownKey, now);

    return NextResponse.json({
      success: true,
      message: `Target alert email sent immediately to ${recipientEmail}!`,
      resendId: resendResult?.id,
      recipient: recipientEmail
    });

  } catch (e: any) {
    console.error('[/api/notifications/target-met Error]:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Failed to dispatch target alert notification' }, { status: 500 });
  }
}
