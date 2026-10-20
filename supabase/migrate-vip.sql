-- Run after schema.sql on existing Supabase projects

alter table public.profiles
  add column if not exists vip_until timestamptz;

alter table public.ratings
  add column if not exists rating_mode text not null default 'full';

alter table public.ratings
  drop constraint if exists ratings_rating_mode_check;

alter table public.ratings
  add constraint ratings_rating_mode_check
  check (rating_mode in ('full', 'overall_only'));

create index if not exists ratings_user_full_day_idx
  on public.ratings (user_id, updated_at desc)
  where rating_mode = 'full';
