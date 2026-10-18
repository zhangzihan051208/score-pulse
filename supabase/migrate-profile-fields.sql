-- Optional: run if profiles already exists without avatar/bio
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
