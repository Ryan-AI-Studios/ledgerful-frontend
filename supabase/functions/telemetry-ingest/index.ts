import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
const PAYLOAD_MAX_SIZE = 10 * 1024; // 10KB cap
serve(async (req)=>{
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    // 1. Basic Abuse Mitigation: Size Cap
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > PAYLOAD_MAX_SIZE) {
      return new Response(JSON.stringify({
        error: "Payload too large"
      }), {
        status: 413,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const payload = await req.json();
    // 2. Schema Validation (matches ChangeGuard M7)
    if (payload.schema_version !== 1) {
      return new Response(JSON.stringify({
        error: "Unsupported schema version"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const requiredFields = [
      "anonymous_id",
      "client_version",
      "platform",
      "sent_at",
      "window_start",
      "window_end",
      "command_counts",
      "features_enabled",
      "active_days_in_window"
    ];
    for (const field of requiredFields){
      if (!(field in payload)) {
        return new Response(JSON.stringify({
          error: `Missing required field: ${field}`
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
    }
    // 3. Insert into database
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SERVICE_ROLE_KEY") ?? "");
    const { error } = await supabaseClient.from("telemetry_events").insert({
      schema_version: payload.schema_version,
      anonymous_id: payload.anonymous_id,
      client_version: payload.client_version,
      platform: payload.platform,
      sent_at: payload.sent_at,
      window_start: payload.window_start,
      window_end: payload.window_end,
      command_counts: payload.command_counts,
      features_enabled: payload.features_enabled,
      active_days_in_window: payload.active_days_in_window
    });
    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({
        error: "Internal server error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(null, {
      status: 204
    });
  } catch (err) {
    console.error("Processing error:", err);
    return new Response(JSON.stringify({
      error: "Invalid JSON payload"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
