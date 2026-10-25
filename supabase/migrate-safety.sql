-- Reports, blocks, and the queue a store listing needs for user content.
-- Run in the Supabase SQL editor after schema.sql.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_user_id uuid references auth.users (id) on delete set null,
  comment_id uuid references public.comments (id) on delete set null,
  event_id text,
  excerpt text,
  reason text not null check (reason in ('spam', 'abuse', 'other')),
  status text not null default 'open' check (status in ('open', 'hidden', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists reports_status_idx
  on public.reports (status, created_at desc);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.reports enable row level security;
alter table public.blocks enable row level security;

create policy "users insert own reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "users read own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "users manage own blocks"
  on public.blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);
