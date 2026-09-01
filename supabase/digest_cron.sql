-- ==============================================================================
-- Supabase In-Database Scheduler for Hardware Digest Dispatch
--
-- How to apply:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/mfzokxffhmedvtuhykdw
-- 2. Go to the "SQL Editor" tab on the left sidebar.
-- 3. Click "New query", paste this script, and click "Run".
-- ==============================================================================

-- 1. Ensure pg_cron and pg_net extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Ensure daily_digests table exists and has open RLS policies
CREATE TABLE IF NOT EXISTS daily_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    headline TEXT NOT NULL,
    executive_summary TEXT NOT NULL,
    report_data JSONB NOT NULL,
    total_saved_opportunity DECIMAL(10, 2) DEFAULT 0.00,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on daily_digests" ON daily_digests;
CREATE POLICY "Allow all on daily_digests" ON daily_digests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on user_preferences" ON user_preferences;
CREATE POLICY "Allow all on user_preferences" ON user_preferences FOR ALL USING (true) WITH CHECK (true);

-- 3. Unschedule previous digest cron if it exists
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT jobid FROM cron.job WHERE jobname = 'dispatch_hardware_digest') LOOP
        PERFORM cron.unschedule(r.jobid);
    END LOOP;
END $$;

-- 4. Schedule daily dispatch trigger at 08:00 UTC
-- The endpoint on Cloudflare Pages automatically handles interval filtering for:
-- - 'daily' (every 24h)
-- - 'every_3_days' (every 72h / 68h threshold)
-- - 'weekly' (every 7 days / 160h threshold)
-- - 'flash_only' (active price drops only)
SELECT cron.schedule(
    'dispatch_hardware_digest',
    '0 8 * * *',
    $$
    SELECT net.http_get(
        url := 'https://rigscouter.ishaankoradia.com/api/cron/dispatch-digest?key=rigscouter-cron-secret'
    );
    $$
);

-- 5. View active cron jobs status
SELECT jobid, jobname, schedule, active, command FROM cron.job;
