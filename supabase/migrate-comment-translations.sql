-- AI comment translations (run in Supabase SQL editor)
alter table public.comments
  add column if not exists body_locale text;

alter table public.comments
  add column if not exists translations jsonb not null default '{}'::jsonb;

create index if not exists comments_translations_gin_idx
  on public.comments using gin (translations);
