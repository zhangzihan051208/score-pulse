-- Run in Supabase Dashboard → SQL → New query

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  updated_at timestamptz not null default now()
);

create table if not exists public.ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id text not null,
  athlete_id text not null,
  sport text not null,
  scores jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id, athlete_id)
);

create index if not exists ratings_event_athlete_idx
  on public.ratings (event_id, athlete_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id text not null,
  athlete_id text not null,
  author text not null default 'Fan',
  body text not null,
  scores jsonb,
  created_at timestamptz not null default now()
);

create index if not exists comments_event_athlete_idx
  on public.comments (event_id, athlete_id, created_at desc);

create unique index if not exists comments_one_per_user_take_idx
  on public.comments (user_id, event_id, athlete_id);

create table if not exists public.sportsdb_fixtures (
  id_event text primary key,
  sport text not null,
  league_id text,
  str_event text,
  str_league text,
  str_home_team text,
  str_away_team text,
  int_home_score int,
  int_away_score int,
  str_status text,
  date_event date,
  str_time text,
  str_thumb text,
  slug text,
  id_home_team text,
  id_away_team text,
  lineup jsonb default '[]'::jsonb,
  raw jsonb,
  synced_at timestamptz not null default now()
);

create unique index if not exists sportsdb_fixtures_slug_idx
  on public.sportsdb_fixtures (slug)
  where slug is not null;

create index if not exists sportsdb_fixtures_sport_date_idx
  on public.sportsdb_fixtures (sport, date_event desc);

alter table public.profiles enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;
alter table public.sportsdb_fixtures enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "ratings are viewable by everyone"
  on public.ratings for select using (true);

create policy "users can insert own ratings"
  on public.ratings for insert with check (auth.uid() = user_id);

create policy "users can update own ratings"
  on public.ratings for update using (auth.uid() = user_id);

create policy "comments are viewable by everyone"
  on public.comments for select using (true);

create policy "users can insert own comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "fixtures are viewable by everyone"
  on public.sportsdb_fixtures for select using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1),
      'Fan'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
