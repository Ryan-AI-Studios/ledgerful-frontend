-- Simple aggregate query for "distinct anonymous_id count in the last 30 days" (MAU)
-- This view allows the business to track user adoption without exposing raw event data.
CREATE OR REPLACE VIEW public.monthly_active_users AS
SELECT
  count(DISTINCT anonymous_id) as active_user_count
FROM
  public.telemetry_events
WHERE
  received_at >= now() - interval '30 days';

-- Secure the view (RLS applies to base tables, but views need their own permissions)
-- This view should only be accessible by the service_role for now.
REVOKE ALL ON public.monthly_active_users FROM public;
GRANT SELECT ON public.monthly_active_users TO service_role;

-- Comment for clarity
COMMENT ON VIEW public.monthly_active_users IS 'Aggregated count of unique users who sent telemetry in the last 30 days.';
