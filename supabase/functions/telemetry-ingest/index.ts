/**
 * Telemetry ingest Edge Function (0077).
 * Order: method → origin → auth → size → quota → parse → deep-validate → insert.
 * verify_jwt remains false; custom bar-raising header is the credential check.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  handleTelemetryRequest,
  serviceRoleKey,
  type TelemetryPayload,
} from "./handler.ts";

const env = {
  get(key: string): string | undefined {
    return Deno.env.get(key) ?? undefined;
  },
};

Deno.serve((req, info) => {
  const remoteAddr = info?.remoteAddr && "hostname" in info.remoteAddr
    ? String((info.remoteAddr as Deno.NetAddr).hostname)
    : null;

  return handleTelemetryRequest(req, {
    env,
    remoteAddr,
    async insert(row: TelemetryPayload) {
      const url = env.get("SUPABASE_URL") ?? "";
      const key = serviceRoleKey(env);
      if (!url || !key) {
        return { error: "missing supabase credentials" };
      }
      const supabase = createClient(url, key);
      const { error } = await supabase.from("telemetry_events").insert({
        schema_version: row.schema_version,
        anonymous_id: row.anonymous_id,
        client_version: row.client_version,
        platform: row.platform,
        sent_at: row.sent_at,
        window_start: row.window_start,
        window_end: row.window_end,
        command_counts: row.command_counts,
        features_enabled: row.features_enabled,
        active_days_in_window: row.active_days_in_window,
      });
      return { error: error ?? null };
    },
  });
});
