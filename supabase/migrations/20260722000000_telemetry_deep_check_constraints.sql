-- 0077: tighter scalar CHECK backstops for deep field caps (app-layer remains authority for JSONB).
-- Idempotent: drop-if-exists then add.

ALTER TABLE public.telemetry_events
  DROP CONSTRAINT IF EXISTS telemetry_events_active_days_check;

ALTER TABLE public.telemetry_events
  ADD CONSTRAINT telemetry_events_active_days_check
  CHECK (
    active_days_in_window >= 0
    AND active_days_in_window <= 366
  );

ALTER TABLE public.telemetry_events
  DROP CONSTRAINT IF EXISTS telemetry_events_client_version_len_check;

ALTER TABLE public.telemetry_events
  ADD CONSTRAINT telemetry_events_client_version_len_check
  CHECK (char_length(client_version) <= 128);

ALTER TABLE public.telemetry_events
  DROP CONSTRAINT IF EXISTS telemetry_events_platform_len_check;

ALTER TABLE public.telemetry_events
  ADD CONSTRAINT telemetry_events_platform_len_check
  CHECK (char_length(platform) <= 128);
