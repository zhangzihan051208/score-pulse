-- Run after profiles exist. Tracks welcome wizard completion.
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;
