-- Cached AI translations of comment body text (locale code -> string).
alter table public.comments
  add column if not exists body_translations jsonb not null default '{}'::jsonb;
