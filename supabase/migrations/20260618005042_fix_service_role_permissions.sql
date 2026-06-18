-- Grant insert permissions to service_role to allow the Edge Function to work
GRANT INSERT ON public.telemetry_events TO service_role;

-- Also grant usage on schema to be safe
GRANT USAGE ON SCHEMA public TO service_role;
