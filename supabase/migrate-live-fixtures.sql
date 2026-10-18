-- Run once on existing Supabase projects (Dashboard → SQL)

alter table public.sportsdb_fixtures
  add column if not exists slug text,
  add column if not exists id_home_team text,
  add column if not exists id_away_team text,
  add column if not exists lineup jsonb default '[]'::jsonb;

create unique index if not exists sportsdb_fixtures_slug_idx
  on public.sportsdb_fixtures (slug)
  where slug is not null;
