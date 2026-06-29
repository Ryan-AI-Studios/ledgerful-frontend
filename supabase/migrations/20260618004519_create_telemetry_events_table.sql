-- Create table for opt-in CLI telemetry events
-- Schema must match Ledgerful Track M7 exactly
create table if not exists public.telemetry_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  schema_version int not null,
  anonymous_id uuid not null,
  client_version text not null,
  platform text not null,
  sent_at timestamptz not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  command_counts jsonb not null,
  features_enabled text[] not null,
  active_days_in_window int not null
);

-- Enable Row Level Security (RLS)
-- By default, this table will be locked down.
-- The Edge Function will use the service_role key to bypass RLS.
alter table public.telemetry_events enable row level security;

-- Performance indices for aggregate queries (MAU/DAU)
create index if not exists telemetry_events_received_at_idx on public.telemetry_events (received_at);
create index if not exists telemetry_events_anonymous_id_idx on public.telemetry_events (anonymous_id);

-- Comment for clarity
comment on table public.telemetry_events is 'Opt-in CLI usage metrics received from Ledgerful CLI.';
