-- DIY rating zones, custom items, zone ratings, comment moderation (run after schema + social migrations)

create table if not exists public.rating_zones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  category text not null default 'food',
  dimensions jsonb not null,
  heat_score numeric not null default 0,
  item_count int not null default 0,
  rating_count int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rating_zones_heat_idx
  on public.rating_zones (heat_score desc, updated_at desc);

create table if not exists public.zone_items (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.rating_zones (id) on delete cascade,
  name text not null,
  photo_url text,
  blurb text,
  heat_score numeric not null default 0,
  rating_count int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists zone_items_zone_heat_idx
  on public.zone_items (zone_id, heat_score desc);

create table if not exists public.zone_ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  zone_id uuid not null references public.rating_zones (id) on delete cascade,
  item_id uuid not null references public.zone_items (id) on delete cascade,
  scores jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index if not exists zone_ratings_item_idx
  on public.zone_ratings (item_id);

alter table public.comments
  add column if not exists zone_id uuid references public.rating_zones (id) on delete cascade,
  add column if not exists zone_item_id uuid references public.zone_items (id) on delete cascade,
  add column if not exists moderation_status text not null default 'approved'
    check (moderation_status in ('pending', 'approved', 'rejected'));

create index if not exists comments_moderation_idx
  on public.comments (zone_id, moderation_status, created_at desc)
  where zone_id is not null;

alter table public.rating_zones enable row level security;
alter table public.zone_items enable row level security;
alter table public.zone_ratings enable row level security;

drop policy if exists "zones are viewable when published" on public.rating_zones;
create policy "zones are viewable when published"
  on public.rating_zones for select using (published = true or auth.uid() = owner_id);

drop policy if exists "users can insert own zones" on public.rating_zones;
create policy "users can insert own zones"
  on public.rating_zones for insert with check (auth.uid() = owner_id);

drop policy if exists "owners can update own zones" on public.rating_zones;
create policy "owners can update own zones"
  on public.rating_zones for update using (auth.uid() = owner_id);

drop policy if exists "zone items viewable when zone visible" on public.zone_items;
create policy "zone items viewable when zone visible"
  on public.zone_items for select using (
    exists (
      select 1 from public.rating_zones z
      where z.id = zone_id and (z.published = true or z.owner_id = auth.uid())
    )
    and (hidden = false or created_by = auth.uid())
  );

drop policy if exists "authenticated can insert zone items" on public.zone_items;
create policy "authenticated can insert zone items"
  on public.zone_items for insert with check (auth.uid() = created_by);

drop policy if exists "creators can update own items" on public.zone_items;
create policy "creators can update own items"
  on public.zone_items for update using (auth.uid() = created_by);

drop policy if exists "zone ratings viewable by everyone" on public.zone_ratings;
create policy "zone ratings viewable by everyone"
  on public.zone_ratings for select using (true);

drop policy if exists "users insert own zone ratings" on public.zone_ratings;
create policy "users insert own zone ratings"
  on public.zone_ratings for insert with check (auth.uid() = user_id);

drop policy if exists "users update own zone ratings" on public.zone_ratings;
create policy "users update own zone ratings"
  on public.zone_ratings for update using (auth.uid() = user_id);

drop policy if exists "zone owners can moderate comments" on public.comments;
create policy "zone owners can moderate comments"
  on public.comments for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.rating_zones z
      where z.id = comments.zone_id and z.owner_id = auth.uid()
    )
  );
