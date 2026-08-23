import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const startTime = performance.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or API key environment variables in Edge Function runtime");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Execute live query against hardware_components table to generate genuine DB read activity
    const { data: components, count, error: queryError } = await supabase
      .from("hardware_components")
      .select("id, name, current_price, updated_at", { count: "exact" })
      .limit(5);

    if (queryError) {
      console.warn("[Keep-Alive Notice] Query on hardware_components:", queryError.message);
    }

    // 2. Optional: Check or update heartbeat timestamp in _supabase_heartbeats if table exists
    try {
      await supabase.from("_supabase_heartbeats").insert({
        source: "supabase_edge_function",
        recorded_at: new Date().toISOString()
      });
    } catch (_insertErr) {
      // Non-blocking if table is not created yet
    }

    const durationMs = Math.round(performance.now() - startTime);
    const timestamp = new Date().toISOString();

    const responsePayload = {
      status: "success",
      message: "Supabase Keep-Alive heartbeat executed successfully",
      timestamp,
      latencyMs: durationMs,
      database: {
        status: queryError ? "warning" : "healthy",
        recordsRetrieved: components?.length ?? 0,
        totalComponents: count ?? 0,
        sampleItem: components && components.length > 0 ? components[0].name : null,
      },
    };

    console.log(`[Keep-Alive] Heartbeat executed at ${timestamp} (Latency: ${durationMs}ms)`);

    return new Response(JSON.stringify(responsePayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error("[Keep-Alive Error]:", err.message);

    return new Response(
      JSON.stringify(
        {
          status: "error",
          message: err.message || "Failed to execute keep-alive query",
          latencyMs: durationMs,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
