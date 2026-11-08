-- One row per source comment per viewer language. Stops repeat translation charges.
create table if not exists public.translation_cache (
  locale text not null,
  body_hash text not null,
  source text not null,
  translated text not null,
  created_at timestamptz not null default now(),
  primary key (locale, body_hash)
);

alter table public.translation_cache enable row level security;
