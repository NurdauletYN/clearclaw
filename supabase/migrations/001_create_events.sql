-- AgentAudit: initial schema migration

create table if not exists public.events (
  id text primary key,
  source text not null check (source in ('claude_code', 'openclaw')),
  type text not null,
  "sessionId" text not null,
  timestamp timestamptz not null,
  payload jsonb null,
  "plainEnglish" text not null,
  "anomalyScore" double precision not null check ("anomalyScore" >= 0 and "anomalyScore" <= 1),
  "anomalyReason" text null,
  created_at timestamptz not null default now()
);

-- indexes for common query patterns
create index if not exists events_timestamp_idx on public.events (timestamp desc);
create index if not exists events_session_id_idx on public.events ("sessionId");
create index if not exists events_source_idx on public.events (source);
create index if not exists events_anomaly_score_idx on public.events ("anomalyScore" desc);

-- row level security
alter table public.events enable row level security;

drop policy if exists "anon_read_events" on public.events;
create policy "anon_read_events"
on public.events
for select
to anon, authenticated
using (true);

drop policy if exists "service_insert_events" on public.events;
create policy "service_insert_events"
on public.events
for insert
to authenticated, service_role
with check (true);

-- realtime
alter publication supabase_realtime add table public.events;
