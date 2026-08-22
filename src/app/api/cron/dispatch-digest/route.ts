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
function cleanDisplayTitle(name: string): string {
  if (!name) return 'Hardware Component';
  let firstPart = name.split(/\s+-\s+|\s+—\s+|\s+\|\s+/)[0].trim();
  firstPart = firstPart.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (firstPart.length < 15 && name.length > firstPart.length) {
    firstPart = name.slice(0, 65).replace(/[, -]+$/, '') + '...';
  }
  return firstPart;
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

function buildDigestEmailHtml(report: any, dateStr: string): string {
  const sortedItems = [...report.items].sort((a: any, b: any) => (a.change24h?.amount || 0) - (b.change24h?.amount || 0));
  const activeDropsCount = sortedItems.filter((entry: any) => (entry.change24h?.amount || 0) < 0).length;
  const totalSavings = sortedItems
    .filter((entry: any) => (entry.change24h?.amount || 0) < 0)
    .reduce((sum: number, entry: any) => sum + Math.abs(entry.change24h?.amount || 0), 0);

  const itemsHtml = sortedItems.map((entry: any) => {
    const item = entry.item;
    const cleanTitle = cleanDisplayTitle(item.componentName || item.name);
    const currentPrice = Number(item.currentPrice || 0).toFixed(2);
    const dropAmount = entry.change24h?.amount || 0;
    const dropPercent = entry.change24h?.percentage || 0;
    const isDrop = dropAmount < 0;
    const rBadge = getRetailerBadgeStyle(item.retailer);

    // Direct product link with fallback
    const directUrl = item.productUrl && item.productUrl.startsWith('http')
      ? item.productUrl
      : `https://www.google.com/search?q=${encodeURIComponent(cleanTitle + ' ' + (item.retailer || ''))}`;

    // Price trajectory timeline calculation
    const p30 = Number(item.previousPrice30d || 0);
    const p7 = Number(item.previousPrice7d || 0);
    const p24 = Number(item.previousPrice24h || 0);
    const hasHistory = p30 > 0 || p7 > 0 || p24 > 0;

    return `
      <div class="glow-card" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);">
        <!-- Top Category & Retailer Chips -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <td style="vertical-align: middle;">
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #38bdf8; background: #0c4a6e; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; border: 1px solid #0284c755;">
                ${item.category || 'GPU'}
              </span>
              ${entry.isAllTimeLow ? `
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #c084fc; background: #581c87; padding: 4px 8px; border-radius: 6px; letter-spacing: 0.5px; margin-left: 6px; border: 1px solid #a855f755;">
                🔥 90D ALL-TIME LOW
              </span>` : ''}
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="font-size: 12px; font-weight: 700; color: ${rBadge.color}; background: ${rBadge.bg}; border: 1px solid ${rBadge.border}; padding: 4px 10px; border-radius: 6px;">
                ${item.retailer || 'Retailer'}
              </span>
            </td>
          </tr>
        </table>

        <!-- Component Title -->
        <h3 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 800; color: #f8fafc; line-height: 1.4;">
          ${cleanTitle}
        </h3>

        <!-- Price Display Box -->
        <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; margin-bottom: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #94a3b8; font-size: 13px; font-weight: 600;">Current Live Price:</td>
              <td style="text-align: right; font-weight: 900; font-size: 20px; color: ${isDrop ? '#34d399' : '#f8fafc'};">
                $${currentPrice}
              </td>
            </tr>
            <tr>
              <td style="color: #94a3b8; font-size: 13px; padding-top: 6px;">24h Price Movement:</td>
              <td style="text-align: right; font-weight: 800; font-size: 14px; padding-top: 6px;">
                ${isDrop ? `
                  <span style="color: #34d399; background: #064e3b44; padding: 2px 8px; border-radius: 4px; border: 1px solid #05966955;">
                    -$${Math.abs(dropAmount).toFixed(2)} (${dropPercent}%)
                  </span>` : `
                  <span style="color: #64748b;">Stable</span>`}
              </td>
            </tr>
          </table>

          ${hasHistory ? `
          <!-- Visual Price Trajectory Timeline -->
          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #1e293b;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px;">
              Price Trajectory
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: center;">
              <tr>
                ${p30 > 0 ? `<td style="color: #64748b;">30d: <strong style="color: #cbd5e1;">$${p30.toFixed(0)}</strong></td>` : ''}
                ${p7 > 0 ? `<td style="color: #64748b;">&rarr; 7d: <strong style="color: #cbd5e1;">$${p7.toFixed(0)}</strong></td>` : ''}
                ${p24 > 0 ? `<td style="color: #64748b;">&rarr; 24h: <strong style="color: #cbd5e1;">$${p24.toFixed(0)}</strong></td>` : ''}
                <td style="color: #34d399; font-weight: 800;">&rarr; Now: $${currentPrice}</td>
              </tr>
            </table>
          </div>` : ''}
        </div>

        <!-- Call to Action Button -->
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="text-align: right;">
              <a href="${directUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);">
                View Deal on ${item.retailer || 'Store'} &rarr;
              </a>
            </td>
          </tr>
        </table>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
          .pulse-indicator {
            display: inline-block;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background-color: #10b981;
            box-shadow: 0 0 10px #10b981;
            animation: pulse 2s infinite ease-in-out;
            vertical-align: middle;
            margin-right: 6px;
          }
          .glow-card {
            transition: all 0.2s ease-in-out;
          }
          .glow-card:hover {
            border-color: #0284c7 !important;
          }
          @media only screen and (min-width: 680px) {
            .digest-container {
              max-width: 960px !important;
              padding: 32px !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; width: 100%;">
        <div class="digest-container" style="width: 100%; max-width: 960px; margin: 0 auto; background-color: #0d1322; border: 1px solid #1e293b; border-radius: 20px; box-sizing: border-box; padding: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Header Bar -->
          <div style="border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 22px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: middle;">
                  <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #38bdf8;">
                    ⚡ RigScouter AI
                  </span>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                  <span style="font-size: 11px; font-weight: 700; color: #34d399; background: #064e3b55; border: 1px solid #05966966; padding: 4px 10px; border-radius: 20px;">
                    <span class="pulse-indicator"></span> LIVE BRIEFING
                  </span>
                </td>
              </tr>
            </table>

            <h1 style="margin: 16px 0 6px 0; font-size: 24px; font-weight: 900; color: #ffffff; line-height: 1.3; letter-spacing: -0.3px;">
              ${report.headline}
            </h1>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">
              ${dateStr} &bull; Autonomous Scraper & Market Engine
            </div>
          </div>

          <!-- Market Dashboard Stats Grid -->
          <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 14px; padding: 18px; margin-bottom: 22px;">
            <table style="width: 100%; border-collapse: collapse; text-align: center;">
              <tr>
                <td style="width: 33%; border-right: 1px solid #1e293b; padding: 6px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Tracked Items</div>
                  <div style="font-size: 22px; font-weight: 900; color: #f8fafc; margin-top: 2px;">${sortedItems.length}</div>
                </td>
                <td style="width: 33%; border-right: 1px solid #1e293b; padding: 6px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Active Drops</div>
                  <div style="font-size: 22px; font-weight: 900; color: ${activeDropsCount > 0 ? '#34d399' : '#f8fafc'}; margin-top: 2px;">${activeDropsCount}</div>
                </td>
                <td style="width: 33%; padding: 6px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">24h Savings</div>
                  <div style="font-size: 22px; font-weight: 900; color: ${totalSavings > 0 ? '#38bdf8' : '#f8fafc'}; margin-top: 2px;">$${totalSavings.toFixed(2)}</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Executive Intelligence Briefing -->
          <div style="background-color: #090d16; border-left: 4px solid #06b6d4; border-radius: 4px 12px 12px 4px; padding: 18px 20px; margin-bottom: 24px; border-top: 1px solid #1e293b; border-right: 1px solid #1e293b; border-bottom: 1px solid #1e293b;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.6px; margin-bottom: 6px;">
              🧠 Executive Intelligence Summary
            </div>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e1; font-weight: 450;">
              ${report.executiveSummary}
            </p>
          </div>

          <!-- Tracked Items Section -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; margin: 0;">
                Live Watchlist Intelligence (${sortedItems.length})
              </h2>
            </div>
            ${itemsHtml}
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0 0 6px 0;">
              Automated hardware intelligence dispatched by <strong style="color: #94a3b8;">RigScouter AI</strong>.
            </p>
            <p style="margin: 0;">
              <a href="https://rigscouter.ishaankoradia.com" style="color: #38bdf8; text-decoration: none; font-weight: 600;">Open RigScouter Dashboard &rarr;</a>
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
