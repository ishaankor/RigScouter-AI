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

-- 2. Unschedule previous digest cron if it exists
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT jobid FROM cron.job WHERE jobname = 'dispatch_hardware_digest') LOOP
        PERFORM cron.unschedule(r.jobid);
    END LOOP;
END $$;

-- 3. Schedule daily dispatch trigger at 08:00 UTC
-- The endpoint on Cloudflare Pages automatically handles interval filtering for:
-- - 'daily' (every 24h)
-- - 'every_3_days' (every 72h)
-- - 'weekly' (every 7 days)
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

-- 4. View active cron jobs status
SELECT jobid, jobname, schedule, active, command FROM cron.job;
