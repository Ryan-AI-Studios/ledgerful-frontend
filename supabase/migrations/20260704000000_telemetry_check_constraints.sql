-- Add CHECK constraints for defense-in-depth on telemetry_events
ALTER TABLE public.telemetry_events
  ADD CONSTRAINT telemetry_events_schema_version_check CHECK (schema_version = 1),
  ADD CONSTRAINT telemetry_events_active_days_check CHECK (active_days_in_window >= 0),
  ADD CONSTRAINT telemetry_events_dates_check CHECK (sent_at >= window_start AND window_end >= window_start);
