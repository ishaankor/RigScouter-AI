import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { generateDailyDigestReport } from '@/lib/ai/digest-generator';

export const runtime = 'edge';

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
function buildDigestEmailHtml(report: any, dateStr: string): string {
  const sortedItems = [...report.items].sort((a: any, b: any) => (a.change24h?.amount || 0) - (b.change24h?.amount || 0));

  const itemsHtml = sortedItems.map((entry: any) => {
    const item = entry.item;
    const currentPrice = Number(item.currentPrice || 0).toFixed(2);
    const dropAmount = entry.change24h?.amount || 0;
    const dropPercent = entry.change24h?.percentage || 0;
    const isDrop = dropAmount < 0;

    // Guaranteed working direct product link with fallback
    const directUrl = item.productUrl && item.productUrl.startsWith('http')
      ? item.productUrl
      : `https://www.google.com/search?q=${encodeURIComponent((item.componentName || item.name) + ' ' + (item.retailer || ''))}`;

    return `
      <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 18px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38bdf8; background: #0c4a6e; padding: 3px 8px; border-radius: 6px;">
            ${item.category || 'Hardware'}
          </span>
          <span style="font-size: 12px; font-weight: 600; color: #9ca3af; background: #1f2937; padding: 3px 10px; border-radius: 6px;">
            ${item.retailer || 'Retailer'}
          </span>
        </div>

        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #f9fafb; line-height: 1.4;">
          ${item.componentName || item.name}
        </h3>

        <div style="background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #94a3b8; font-size: 13px; padding-bottom: 4px;">Current Live Price:</td>
              <td style="text-align: right; font-weight: 800; font-size: 17px; color: #34d399;">$${currentPrice}</td>
            </tr>
            ${isDrop ? `
            <tr>
              <td style="color: #94a3b8; font-size: 13px;">24h Price Movement:</td>
              <td style="text-align: right; font-weight: 700; font-size: 13px; color: #34d399;">
                -$${Math.abs(dropAmount).toFixed(2)} (${dropPercent}%)
              </td>
            </tr>` : `
            <tr>
              <td style="color: #94a3b8; font-size: 13px;">24h Price Movement:</td>
              <td style="text-align: right; font-weight: 600; font-size: 13px; color: #64748b;">Stable</td>
            </tr>`}
            ${entry.isAllTimeLow ? `
            <tr>
              <td colspan="2" style="padding-top: 8px;">
                <span style="display: inline-block; font-size: 11px; font-weight: 700; color: #c084fc; background: #581c87; padding: 2px 8px; border-radius: 4px;">
                  🚀 90-Day All-Time Low
                </span>
              </td>
            </tr>` : ''}
          </table>
        </div>

        <div style="text-align: right;">
          <a href="${directUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 9px 18px; background-color: #06b6d4; color: #020617; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; letter-spacing: 0.2px;">
            View Deal on ${item.retailer || 'Store'} &rarr;
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0b0f19; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; padding: 24px;">
          
          <!-- Header -->
          <div style="border-bottom: 1px solid #1f2937; padding-bottom: 18px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 18px; font-weight: 900; letter-spacing: -0.5px; color: #38bdf8;">
                ⚡ RigScouter AI
              </span>
              <span style="font-size: 12px; color: #6b7280; font-weight: 600;">
                ${dateStr}
              </span>
            </div>
            <h1 style="margin: 14px 0 0 0; font-size: 20px; font-weight: 800; color: #f9fafb; line-height: 1.3;">
              ${report.headline}
            </h1>
          </div>

          <!-- Executive Intelligence Briefing -->
          <div style="background-color: #0f172a; border-left: 4px solid #38bdf8; border-radius: 4px 8px 8px 4px; padding: 14px 16px; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px; margin-bottom: 4px;">
              Market Summary
            </div>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              ${report.executiveSummary}
            </p>
          </div>

          <!-- Tracked Items Section -->
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin: 0 0 14px 0;">
              Tracked Component Intelligence
            </h2>
            ${itemsHtml}
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #1f2937; padding-top: 18px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0 0 8px 0;">
              Automated hardware intelligence dispatched by <strong>RigScouter AI</strong>.
            </p>
            <p style="margin: 0;">
              <a href="https://rigscouter-ai.vercel.app" style="color: #38bdf8; text-decoration: none;">Manage Digest Preferences</a>
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'rigscouter-cron-secret';

  // Basic security check for automated triggers
  if (authHeader !== `Bearer ${cronSecret}` && req.nextUrl.searchParams.get('key') !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized cron execution request' }, { status: 401 });
  }

  try {
    const isTest = req.nextUrl.searchParams.get('test') === 'true';
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // TEST MODE: Fetch real hardware components from DB and send digest email
    if (isTest) {
      const { data: dbItems } = await supabaseAdmin
        .from('hardware_components')
        .select('*')
        .order('current_price', { ascending: true })
        .limit(4);

      const realItems = (dbItems || []).map(item => {
        const price = Number(item.current_price || item.msrp || 100);
        return {
          id: item.id,
          userId: 'test-user',
          componentName: item.name,
          category: item.category || 'Hardware',
          targetPrice: item.msrp ? Math.round(item.msrp * 0.9 * 100) / 100 : price,
          currentPrice: price,
          previousPrice24h: item.lowest_price_90d && item.lowest_price_90d < price ? Number(item.lowest_price_90d) : price,
          previousPrice7d: price,
          previousPrice30d: price,
          allTimeLow: item.lowest_price_90d || price,
          retailer: item.retailer || 'Amazon',
          productUrl: item.product_url || '#',
          imageUrl: item.image_url,
          inStock: true,
          notifyOnFlashDrop: true,
          addedAt: item.updated_at
        };
      });

      const report = await generateDailyDigestReport(realItems);
      const htmlContent = buildDigestEmailHtml(report, todayStr);

      const customDomain = process.env.RESEND_DOMAIN || 'rigscouter@ishaankoradia.com';
      await sendResendEmail({
        from: `"RigScouter AI" <${customDomain}>`,
        to: 'ishaankor@gmail.com',
        subject: report.headline,
        html: htmlContent,
      });

      return NextResponse.json({ message: 'Data-driven test email successfully dispatched to ishaankor@gmail.com!' });
    }

    // 1. Fetch all users who have subscribed to the digest
    const { data: preferences, error: prefError } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .neq('summary_frequency', 'none');

    if (prefError) {
      throw new Error(`Failed to fetch user preferences: ${prefError.message}`);
    }

    if (!preferences || preferences.length === 0) {
      return NextResponse.json({ message: 'No subscribed users found in user_preferences', dispatchedCount: 0 });
    }

    // Fetch hardware components once for catalog matching
    const { data: allHwComponents } = await supabaseAdmin
      .from('hardware_components')
      .select('*');

    const hwMap = new Map<string, any>();
    (allHwComponents || []).forEach((hw: any) => {
      if (hw.id) hwMap.set(hw.id.toLowerCase(), hw);
      if (hw.name) hwMap.set(hw.name.toLowerCase().trim(), hw);
      if (hw.model) hwMap.set(hw.model.toLowerCase().trim(), hw);
    });

    let dispatchedCount = 0;
    const deliveries: any[] = [];
    const errors: any[] = [];

    // 2. For each user, fetch their watchlist (or top deals fallback) and send digest
    for (const pref of preferences) {
      try {
        let deliveryChannels = { email: true, emailAddress: '' };
        try {
          if (typeof pref.delivery_channels === 'string') {
            deliveryChannels = JSON.parse(pref.delivery_channels);
          } else {
            deliveryChannels = pref.delivery_channels;
          }
        } catch (e) {
          console.warn(`Could not parse delivery channels for user ${pref.user_id}`);
        }

        const targetEmail = deliveryChannels.emailAddress;
        if (!targetEmail || !deliveryChannels.email) {
          continue;
        }

        // Fetch their watchlist items
        const { data: watchlistItems } = await supabaseAdmin
          .from('watchlist_items')
          .select('*')
          .eq('user_id', pref.user_id);

        let formattedWatchlist: any[] = [];
        if (watchlistItems && watchlistItems.length > 0) {
          formattedWatchlist = watchlistItems.map((item: any) => {
            // Find all candidate offers from retailers for this component
            const candidates = (allHwComponents || []).filter((h: any) => {
              if (!h || !h.current_price) return false;
              if (item.component_id && h.id) {
                const compId = item.component_id.toLowerCase();
                const hId = h.id.toLowerCase();
                if (hId === compId || hId.startsWith(compId) || compId.startsWith(hId)) return true;
              }
              if (item.component_name && h.name) {
                const iName = item.component_name.toLowerCase().trim();
                const hName = h.name.toLowerCase().trim();
                if (hName === iName || hName.includes(iName.slice(0, 25)) || iName.includes(hName.slice(0, 25))) return true;
              }
              return false;
            });

            // Automatically pick the best / lowest price available across all stores
            const matchedHw = candidates.length > 0 
              ? candidates.sort((a, b) => Number(a.current_price || 0) - Number(b.current_price || 0))[0]
              : null;

            const currentPrice = Number(
              matchedHw?.current_price ||
              item.current_price ||
              item.all_time_low ||
              item.target_price ||
              100
            );

            const retailer = matchedHw?.retailer || item.retailer || 'Amazon';
            const productUrl = matchedHw?.product_url || item.product_url || '#';
            const imageUrl = matchedHw?.image_url || item.image_url;
            const allTimeLow = Number(item.all_time_low || matchedHw?.lowest_price_90d || currentPrice);
            const previousPrice24h = Number(item.previous_price_24h || currentPrice);
            const previousPrice7d = Number(item.previous_price_7d || currentPrice);
            const previousPrice30d = Number(item.previous_price_30d || currentPrice);

            return {
              id: item.id,
              userId: item.user_id,
              componentName: item.component_name,
              category: item.category || matchedHw?.category || 'Hardware',
              targetPrice: Number(item.target_price || Math.round(currentPrice * 0.9)),
              currentPrice,
              previousPrice24h,
              previousPrice7d,
              previousPrice30d,
              allTimeLow,
              retailer,
              productUrl,
              imageUrl,
              inStock: item.in_stock ?? true,
              notifyOnFlashDrop: item.notify_on_flash_drop ?? true,
              addedAt: item.added_at,
              specs: item.specs
            };
          });
        } else {
          // Fallback to top market deals from catalog if user watchlist is empty
          const { data: dbItems } = await supabaseAdmin
            .from('hardware_components')
            .select('*')
            .order('current_price', { ascending: true })
            .limit(5);

          formattedWatchlist = (dbItems || []).map((item: any) => ({
            id: item.id,
            userId: pref.user_id,
            componentName: item.name,
            category: item.category || 'Hardware',
            targetPrice: item.msrp ? Math.round(item.msrp * 0.9 * 100) / 100 : Number(item.current_price || 100),
            currentPrice: Number(item.current_price || 100),
            previousPrice24h: item.lowest_price_90d ? Number(item.lowest_price_90d) : Number(item.current_price || 100),
            previousPrice7d: Number(item.current_price || 100),
            previousPrice30d: Number(item.current_price || 100),
            allTimeLow: Number(item.lowest_price_90d || item.current_price || 100),
            retailer: item.retailer || 'Amazon',
            productUrl: item.product_url || '#',
            imageUrl: item.image_url,
            inStock: true,
            notifyOnFlashDrop: true,
            addedAt: item.updated_at
          }));
        }

        if (formattedWatchlist.length === 0) continue;

        const report = await generateDailyDigestReport(formattedWatchlist as any);
        const htmlContent = buildDigestEmailHtml(report, todayStr);

        const customDomain = process.env.RESEND_DOMAIN || 'rigscouter@ishaankoradia.com';
        const sendRes = await sendResendEmail({
          from: `"RigScouter AI" <${customDomain}>`,
          to: targetEmail,
          subject: report.headline,
          html: htmlContent,
        });

        deliveries.push({ to: targetEmail, resendId: sendRes?.id, headline: report.headline });
        dispatchedCount++;

      } catch (userErr: any) {
        errors.push({ userId: pref.user_id, error: userErr.message });
      }
    }

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      dispatchedCount,
      deliveries: deliveries.length > 0 ? deliveries : undefined,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cron digest dispatch failed' }, { status: 500 });
  }
}
