-- AgentAudit: subscriptions table (managed by Lemon Squeezy webhooks)

create table if not exists public.subscriptions (
  id          text        primary key,           -- Lemon Squeezy subscription or order ID
  user_email  text        not null,
  status      text        not null default 'active',  -- active | cancelled | expired | paused | past_due
  plan        text        not null default 'pro',
  renews_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists subscriptions_user_email_idx on public.subscriptions (user_email);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

alter table public.subscriptions enable row level security;

drop policy if exists "authenticated_read_subscriptions" on public.subscriptions;
create policy "authenticated_read_subscriptions"
  on public.subscriptions for select
  to authenticated
  using (true);

drop policy if exists "service_manage_subscriptions" on public.subscriptions;
create policy "service_manage_subscriptions"
  on public.subscriptions for all
  to service_role
  using (true)
  with check (true);
