-- Athlete display + team linkage for player hubs and rankings (run after schema.sql)

create table if not exists public.athlete_profiles (
  sport text not null,
  athlete_id text not null,
  display_name text not null,
  team_id text,
  team_name text,
  photo_url text,
  position_key text not null default 'nba.guard',
  updated_at timestamptz not null default now(),
  primary key (sport, athlete_id)
);

create index if not exists athlete_profiles_team_idx
  on public.athlete_profiles (sport, team_id)
  where team_id is not null;

alter table public.athlete_profiles enable row level security;

create policy "athlete profiles are viewable by everyone"
  on public.athlete_profiles for select using (true);

create policy "authenticated users can upsert athlete profiles"
  on public.athlete_profiles for insert with check (auth.uid() is not null);

create policy "authenticated users can update athlete profiles"
  on public.athlete_profiles for update using (auth.uid() is not null);
