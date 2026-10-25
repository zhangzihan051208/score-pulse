-- Run once on a project created before these columns existed.
-- Safe to run more than once.

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles
  add column if not exists favorite_teams jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists vip_until timestamptz;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

alter table public.ratings
  add column if not exists rating_mode text not null default 'full';

alter table public.ratings drop constraint if exists ratings_rating_mode_check;
alter table public.ratings
  add constraint ratings_rating_mode_check
  check (rating_mode in ('full', 'overall_only'));
