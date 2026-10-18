alter table public.profiles
  add column if not exists favorite_teams jsonb not null default '{}'::jsonb;
