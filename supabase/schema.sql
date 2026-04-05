-- 家庭食材管理 MVP — 在 Supabase SQL Editor 執行此檔
-- 注意：下列 RLS 允許匿名讀寫，僅適合本機／信任環境；上線前請改為登入使用者與適當政策

create table if not exists public.fridges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  fridge_id uuid not null references public.fridges (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists zones_fridge_id_idx on public.zones (fridge_id);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity numeric not null default 1 check (quantity >= 0),
  unit text not null default '個',
  fridge_id uuid not null references public.fridges (id) on delete restrict,
  zone_id uuid not null references public.zones (id) on delete restrict,
  purchase_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_fridge_id_idx on public.items (fridge_id);
create index if not exists items_zone_id_idx on public.items (zone_id);
create index if not exists items_name_search_idx on public.items (lower(name));

alter table public.fridges enable row level security;
alter table public.zones enable row level security;
alter table public.items enable row level security;

-- MVP：以 anon 金鑰即可讀寫（請勿在公開網路長期使用）
create policy "mvp_anon_all_fridges"
  on public.fridges for all
  to anon
  using (true) with check (true);

create policy "mvp_anon_all_zones"
  on public.zones for all
  to anon
  using (true) with check (true);

create policy "mvp_anon_all_items"
  on public.items for all
  to anon
  using (true) with check (true);

-- 若你也要用 service_role 以外的 authenticated 角色，可再加對 authenticated 的政策
