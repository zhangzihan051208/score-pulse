-- Run in Supabase Dashboard → SQL → New query

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  favorite_teams jsonb not null default '{}'::jsonb,
  vip_until timestamptz,
  onboarding_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id text not null,
  athlete_id text not null,
  sport text not null,
  scores jsonb not null,
  rating_mode text not null default 'full' check (rating_mode in ('full', 'overall_only')),
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id, athlete_id)
);

alter table public.ratings
  add column if not exists rating_mode text not null default 'full';

alter table public.ratings
  drop constraint if exists ratings_rating_mode_check;

alter table public.ratings
  add constraint ratings_rating_mode_check
  check (rating_mode in ('full', 'overall_only'));

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
  parent_id uuid references public.comments (id) on delete cascade,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Existing projects already have comments without these columns.
-- CREATE TABLE IF NOT EXISTS does not add them.
alter table public.comments
  add column if not exists parent_id uuid references public.comments (id) on delete cascade;

alter table public.comments
  add column if not exists hidden boolean not null default false;

create index if not exists comments_event_athlete_idx
  on public.comments (event_id, athlete_id, created_at desc);

create unique index if not exists comments_one_take_per_user_idx
  on public.comments (user_id, event_id, athlete_id)
  where parent_id is null;

create index if not exists comments_parent_idx
  on public.comments (parent_id, created_at asc)
  where parent_id is not null;

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

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
alter table public.comment_likes enable row level security;
alter table public.sportsdb_fixtures enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "ratings are viewable by everyone" on public.ratings;
create policy "ratings are viewable by everyone"
  on public.ratings for select using (true);

drop policy if exists "users can insert own ratings" on public.ratings;
create policy "users can insert own ratings"
  on public.ratings for insert with check (auth.uid() = user_id);

drop policy if exists "users can update own ratings" on public.ratings;
create policy "users can update own ratings"
  on public.ratings for update using (auth.uid() = user_id);

drop policy if exists "comments are viewable by everyone" on public.comments;
create policy "comments are viewable by everyone"
  on public.comments for select using (true);

drop policy if exists "users can insert own comments" on public.comments;
create policy "users can insert own comments"
  on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "authors can hide own comments" on public.comments;
create policy "authors can hide own comments"
  on public.comments for update using (auth.uid() = user_id);

drop policy if exists "comment likes are viewable by everyone" on public.comment_likes;
create policy "comment likes are viewable by everyone"
  on public.comment_likes for select using (true);

drop policy if exists "users can like comments" on public.comment_likes;
create policy "users can like comments"
  on public.comment_likes for insert with check (auth.uid() = user_id);

drop policy if exists "users can unlike own likes" on public.comment_likes;
create policy "users can unlike own likes"
  on public.comment_likes for delete using (auth.uid() = user_id);

drop policy if exists "fixtures are viewable by everyone" on public.sportsdb_fixtures;
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
