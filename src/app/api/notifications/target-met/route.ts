import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { sendDiscordTargetAlertWebhook, isValidDiscordWebhookUrl } from '@/lib/notifications/discord';

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
  if (r.includes('amazon')) return { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' };
  if (r.includes('newegg')) return { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' };
  if (r.includes('micro')) return { bg: '#ffe4e6', color: '#be123c', border: '#fca5a5' };
  if (r.includes('b&h') || r.includes('bh')) return { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' };
  if (r.includes('ebay')) return { bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' };
  if (r.includes('best')) return { bg: '#fefce8', color: '#854d0e', border: '#fde047' };
  return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
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
  <style>
    @media print {
      body, table, td {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body bgcolor="#f8fafc" style="margin: 0; padding: 20px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; width: 100%;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; width: 100%;">
    <tr>
      <td align="center" style="padding: 0 10px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; text-align: left;">
          <tr>
            <td style="padding: 24px;">
              
              <!-- Top Header -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0284c7;">
                      ⚡ RigScouter AI
                    </span>
                    <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">
                      🎯 Instant Target Alert Notification
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Main Alert Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    
                    <!-- Top Badges -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                      <tr>
                        <td>
                          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #047857; background-color: #ecfdf5; padding: 4px 10px; border-radius: 6px; border: 1px solid #86efac;">
                            🎯 TARGET PRICE MET
                          </span>
                          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0369a1; background-color: #e0f2fe; padding: 4px 8px; border-radius: 6px; margin-left: 6px; border: 1px solid #bae6fd;">
                            ${category}
                          </span>
                        </td>
                        <td style="text-align: right;">
                          <span style="font-size: 12px; font-weight: 700; color: ${rBadge.color}; background-color: ${rBadge.bg}; border: 1px solid ${rBadge.border}; padding: 4px 10px; border-radius: 6px;">
                            ${retailer}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Product Title -->
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.4;">
                      ${componentName}
                    </h2>

                    <!-- Price Comparison Box -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 16px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 50%; vertical-align: top; border-right: 1px solid #e2e8f0; padding-right: 14px;">
                                <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Current Live Price</div>
                                <div style="font-size: 26px; font-weight: 900; color: #047857; margin-top: 4px;">
                                  $${currentPrice.toFixed(2)}
                                </div>
                                <div style="font-size: 11px; color: #047857; font-weight: 800; margin-top: 2px;">
                                  ${diff > 0 ? `✓ $${diff.toFixed(2)} (${savingsPct}%) under target!` : '✓ Exactly at target price!'}
                                </div>
                              </td>
                              <td style="width: 50%; vertical-align: top; padding-left: 14px;">
                                <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Your Target Alert</div>
                                <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 6px;">
                                  $${targetPrice.toFixed(2)}
                                </div>
                                <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 2px;">
                                  Stock: In Stock
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Action Button -->
                    <div style="text-align: center;">
                      <a href="${directBuyUrl}" target="_blank" style="display: block; background-color: #047857; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 24px; border-radius: 8px; letter-spacing: 0.3px;">
                        ⚡ Buy Now at ${retailer} for $${currentPrice.toFixed(2)} &rarr;
                      </a>
                    </div>

                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="text-align: center; font-size: 11px; color: #64748b; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px 0;">
                      You received this automated notification because flash drop alerts are enabled on your RigScouter Watchlist.
                    </p>
                    <p style="margin: 0;">
                      &copy; ${new Date().getFullYear()} RigScouter AI. Real-time Multi-Retailer Hardware Engine.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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

    // Resolve user delivery channel preferences and destinations
    let deliveryChannels: any = null;
    let targetWebhookUrl: string | null = null;
    let recipientEmail = userEmail;

    if (body.webhookUrl && isValidDiscordWebhookUrl(body.webhookUrl)) {
      targetWebhookUrl = body.webhookUrl.trim();
    }

    if (userId) {
      try {
        const { data: userPref, error: prefErr } = await supabaseAdmin
          .from('user_preferences')
          .select('delivery_channels')
          .eq('user_id', userId)
          .maybeSingle();

        if (prefErr) {
          console.warn('user_preferences lookup notice:', prefErr.message);
        }

        if (userPref?.delivery_channels) {
          deliveryChannels = typeof userPref.delivery_channels === 'string'
            ? JSON.parse(userPref.delivery_channels)
            : userPref.delivery_channels;

          if (!recipientEmail && deliveryChannels?.emailAddress) {
            recipientEmail = deliveryChannels.emailAddress;
          }

          const wh = deliveryChannels?.discord_webhook || deliveryChannels?.discordWebhook;
          if (!targetWebhookUrl && isValidDiscordWebhookUrl(wh)) {
            targetWebhookUrl = wh;
          }
        }
      } catch (err) {
        console.warn('Target-met user preference lookup error:', err);
      }
    }

    const shouldSendDiscord = Boolean(targetWebhookUrl && (deliveryChannels ? deliveryChannels.discord !== false : true));
    const shouldSendEmail = Boolean(deliveryChannels ? deliveryChannels.email === true : true);

    // Cooldown check (1-min throttle per user/destination + component + targetPrice to allow rapid testing)
    const cooldownId = userId || recipientEmail || targetWebhookUrl || 'anonymous';
    const cooldownKey = `${cooldownId}:${componentName.toLowerCase().slice(0, 20)}:${targetPrice}`;
    const now = Date.now();
    const lastSent = sentAlertsCooldown.get(cooldownKey) || 0;
    if (!force && now - lastSent < 60 * 1000) {
      return NextResponse.json({
        success: true,
        message: 'Notification skipped due to 1-minute alert cooldown for this component & target price.',
        throttled: true
      });
    }

    let discordSuccess = false;
    let discordError: string | undefined;

    // 1. Dispatch to Discord Webhook
    if (shouldSendDiscord && targetWebhookUrl) {
      try {
        const discRes = await sendDiscordTargetAlertWebhook({
          webhookUrl: targetWebhookUrl,
          componentName,
          currentPrice,
          targetPrice,
          retailer,
          productUrl,
          imageUrl
        });
        discordSuccess = discRes.success;
        if (!discRes.success) discordError = discRes.error;
      } catch (discErr: any) {
        console.warn('Target-met Discord webhook error:', discErr);
        discordError = discErr.message;
      }
    }

    let emailSuccess = false;
    let emailError: string | undefined;
    let resendId: string | undefined;

    // 2. Dispatch to Email via Resend
    if (shouldSendEmail && (recipientEmail || process.env.ADMIN_ALERT_EMAIL) && process.env.RESEND_API_KEY) {
      const emailTo = recipientEmail || process.env.ADMIN_ALERT_EMAIL || 'ishaankor@gmail.com';
      try {
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
          to: emailTo,
          subject,
          html
        });

        emailSuccess = true;
        resendId = resendResult?.id;
      } catch (eErr: any) {
        console.warn('Target-met Email dispatch error:', eErr.message);
        emailError = eErr.message;
      }
    }

    if (discordSuccess || emailSuccess) {
      sentAlertsCooldown.set(cooldownKey, now);
    }

    return NextResponse.json({
      success: discordSuccess || emailSuccess,
      dispatched: {
        discord: discordSuccess,
        email: emailSuccess
      },
      errors: {
        ...(discordError ? { discord: discordError } : {}),
        ...(emailError ? { email: emailError } : {})
      },
      message: discordSuccess && emailSuccess
        ? 'Alert dispatched via Discord Webhook and Email!'
        : discordSuccess
        ? 'Alert dispatched to your Discord Webhook channel!'
        : emailSuccess
        ? `Alert dispatched via Email to ${recipientEmail}!`
        : 'Alert could not be dispatched. Please verify your Discord Webhook URL or Email settings.'
    });

  } catch (e: any) {
    console.error('[/api/notifications/target-met Error]:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Failed to dispatch target alert notification' }, { status: 500 });
  }
}
