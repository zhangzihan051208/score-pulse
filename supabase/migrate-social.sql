-- Social: comment replies, likes, hide, profile engagement (run after migrate-vip.sql)

alter table public.comments
  add column if not exists parent_id uuid references public.comments (id) on delete cascade;

alter table public.comments
  add column if not exists hidden boolean not null default false;

drop index if exists public.comments_one_per_user_take_idx;

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

alter table public.comment_likes enable row level security;

create policy "comment likes are viewable by everyone"
  on public.comment_likes for select using (true);

create policy "users can like comments"
  on public.comment_likes for insert with check (auth.uid() = user_id);

create policy "users can unlike own likes"
  on public.comment_likes for delete using (auth.uid() = user_id);

create policy "authors can hide own comments"
  on public.comments for update using (auth.uid() = user_id);
