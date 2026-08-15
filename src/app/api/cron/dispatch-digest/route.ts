import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { generateDailyDigestReport } from '@/lib/ai/digest-generator';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs'; // Use nodejs runtime for nodemailer

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'rigscouter-cron-secret';

  // Basic security check for automated triggers
  if (authHeader !== `Bearer ${cronSecret}` && req.nextUrl.searchParams.get('key') !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized cron execution request' }, { status: 401 });
  }

  // Initialize SMTP transport with Resend
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY,
    },
  });

  try {
    const isTest = req.nextUrl.searchParams.get('test') === 'true';

    // TEST MODE: Bypass DB entirely and send a mock email directly
    if (isTest) {
      const mockItems = [
        {
          id: '1', userId: 'test', componentName: 'NVIDIA - GeForce RTX 5080 Founders Edition 16GB GDDR7',
          category: 'GPU', targetPrice: 999.99, currentPrice: 999.99, previousPrice24h: 1049.99,
          previousPrice7d: 1079.99, previousPrice30d: 1199.99, allTimeLow: 999.99,
          retailer: 'Best Buy', productUrl: '#', imageUrl: 'https://via.placeholder.com/150',
          inStock: true, notifyOnFlashDrop: true, addedAt: new Date()
        },
        {
          id: '2', userId: 'test', componentName: 'ASUS GeForce GTX 1060 6GB GDDR5',
          category: 'GPU', targetPrice: 100.00, currentPrice: 110.00, previousPrice24h: 115.50,
          previousPrice7d: 118.80, previousPrice30d: 120.00, allTimeLow: 90.00,
          retailer: 'Newegg', productUrl: '#', imageUrl: 'https://via.placeholder.com/150',
          inStock: true, notifyOnFlashDrop: true, addedAt: new Date()
        }
      ] as any[];

      const report = await generateDailyDigestReport(mockItems);
      
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #fff; padding: 20px; border-radius: 8px;">
          <h1 style="color: #4ade80;">${report.headline}</h1>
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6;">${report.executiveSummary}</p>
          <hr style="border-color: #1e293b; margin: 30px 0;" />
          <h3 style="color: #94a3b8; margin-bottom: 20px;">Top Watchlist Updates</h3>
          
          ${[...report.items].sort((a, b) => a.change24h.amount - b.change24h.amount).slice(0, 3).map(item => `
            <div style="background: #1e293b; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid ${item.change24h.amount < 0 ? '#4ade80' : '#475569'};">
              <p style="margin:0; font-weight: bold; font-size: 18px;">${item.item.componentName}</p>
              <p style="margin:5px 0 0 0; color: #cbd5e1; font-size: 14px;">Retailer: ${item.item.retailer} | Current: $${item.item.currentPrice.toFixed(2)}</p>
              ${item.change24h.amount < 0 ? `<p style="margin:5px 0 0 0; color: #4ade80; font-weight: bold;">Drop: -$${Math.abs(item.change24h.amount).toFixed(2)} (${item.change24h.percentage}%)</p>` : ''}
              ${item.isAllTimeLow ? `<p style="margin:5px 0 0 0; color: #a78bfa; font-weight: bold;">🚀 90-Day All-Time Low!</p>` : ''}
              <a href="${item.item.productUrl}" style="display: inline-block; margin-top: 12px; color: #38bdf8; text-decoration: none; font-size: 14px; font-weight: bold;">View Deal →</a>
            </div>
          `).join('')}
          
          <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">Sent by RigScouter-AI Automater</p>
        </div>
      `;

      const customDomain = process.env.RESEND_DOMAIN || 'updates@your-custom-domain.com';
      await transporter.sendMail({
        from: `"RigScouter-AI" <${customDomain}>`,
        to: 'ishaankor@gmail.com', // Sending directly to the user's email for testing
        subject: `[TEST] ${report.headline}`,
        html: htmlContent,
      });

      return NextResponse.json({ message: 'Test email successfully dispatched to ishaankor@gmail.com!' });
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
      return NextResponse.json({ message: 'No subscribed users found', dispatchedCount: 0 });
    }

    let dispatchedCount = 0;
    const errors: any[] = [];

    // 2. For each user, fetch their watchlist and generate/send digest
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

        // We need a target email. If not in preferences, we would need to fetch it from Auth,
        // but for now we expect the user to provide it via custom routing.
        const targetEmail = deliveryChannels.emailAddress;
        if (!targetEmail || !deliveryChannels.email) {
          continue; // Skip if no valid routing email
        }

        // Fetch their watchlist items
        const { data: watchlistItems, error: wlError } = await supabaseAdmin
          .from('watchlist_items')
          .select('*')
          .eq('user_id', pref.user_id);

        if (wlError || !watchlistItems || watchlistItems.length === 0) {
          continue; // Skip if no watchlist
        }

        // Map DB snake_case columns to camelCase expected by the generator
        const formattedWatchlist = watchlistItems.map(item => ({
          id: item.id,
          userId: item.user_id,
          componentName: item.component_name,
          category: item.category,
          targetPrice: item.target_price,
          currentPrice: item.current_price,
          previousPrice24h: item.previous_price_24h || item.current_price,
          previousPrice7d: item.previous_price_7d || item.current_price,
          previousPrice30d: item.previous_price_30d || item.current_price,
          allTimeLow: item.all_time_low || item.current_price,
          retailer: item.retailer,
          productUrl: item.product_url,
          imageUrl: item.image_url,
          inStock: item.in_stock,
          notifyOnFlashDrop: item.notify_on_flash_drop,
          addedAt: item.added_at,
          specs: item.specs
        }));

        // 3. Generate HTML Payload
        const report = await generateDailyDigestReport(formattedWatchlist as any);

        const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #fff; padding: 20px; border-radius: 8px;">
          <h1 style="color: #4ade80;">${report.headline}</h1>
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6;">${report.executiveSummary}</p>
          <hr style="border-color: #1e293b; margin: 30px 0;" />
          <h3 style="color: #94a3b8; margin-bottom: 20px;">Top Watchlist Updates</h3>
          
          ${[...report.items].sort((a, b) => a.change24h.amount - b.change24h.amount).slice(0, 3).map(item => `
            <div style="background: #1e293b; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid ${item.change24h.amount < 0 ? '#4ade80' : '#475569'};">
              <p style="margin:0; font-weight: bold; font-size: 18px;">${item.item.componentName}</p>
              <p style="margin:5px 0 0 0; color: #cbd5e1; font-size: 14px;">Retailer: ${item.item.retailer} | Current: $${item.item.currentPrice.toFixed(2)}</p>
              ${item.change24h.amount < 0 ? `<p style="margin:5px 0 0 0; color: #4ade80; font-weight: bold;">Drop: -$${Math.abs(item.change24h.amount).toFixed(2)} (${item.change24h.percentage}%)</p>` : ''}
              ${item.isAllTimeLow ? `<p style="margin:5px 0 0 0; color: #a78bfa; font-weight: bold;">🚀 90-Day All-Time Low!</p>` : ''}
              <a href="${item.item.productUrl}" style="display: inline-block; margin-top: 12px; color: #38bdf8; text-decoration: none; font-size: 14px; font-weight: bold;">View Deal →</a>
            </div>
          `).join('')}
          
          <div style="margin-top: 30px; font-size: 12px; color: #8b949e; text-align: center;">
            Automated dispatch by RigScouter-AI. <a href="https://rigscouter-ai.vercel.app" style="color: #38bdf8;">Manage Preferences</a>
          </div>
        </div>
        `;

        // 4. Send Email
        const customDomain = process.env.RESEND_DOMAIN || 'updates@your-custom-domain.com';
        await transporter.sendMail({
          from: `"RigScouter-AI" <${customDomain}>`,
          to: targetEmail,
          subject: report.headline,
          html: htmlContent,
        });

        dispatchedCount++;

      } catch (userErr: any) {
        errors.push({ userId: pref.user_id, error: userErr.message });
      }
    }

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      dispatchedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cron digest dispatch failed' }, { status: 500 });
  }
}
