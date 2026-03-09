-- ClearClaw: key-value settings table

create table if not exists public.settings (
  key         text        primary key,
  value       jsonb       not null,
  updated_at  timestamptz not null default now()
);

-- Seed defaults (do not overwrite if already present)
insert into public.settings (key, value) values
  ('daemon_paused', 'false'),
  ('permissions', '{"block_sudo": true, "alert_secrets": true, "require_network_confirm": false}')
on conflict (key) do nothing;

alter table public.settings enable row level security;

drop policy if exists "authenticated_read_settings" on public.settings;
create policy "authenticated_read_settings"
  on public.settings for select
  to authenticated
  using (true);

drop policy if exists "service_manage_settings" on public.settings;
create policy "service_manage_settings"
  on public.settings for all
  to service_role
  using (true)
  with check (true);
