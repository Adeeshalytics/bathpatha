-- =====================================================================
--  බත්පත (Bathpatha) — Supabase schema
--  Run this in the Supabase SQL editor (or `supabase db push`).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
--  users
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  pin_hash    text,                       -- null until the user sets a PIN on first login
  role        text not null default 'user' check (role in ('admin', 'user', 'chef')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  settings (single row, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id              integer primary key default 1 check (id = 1),
  breakfast_price integer not null default 200,
  dinner_price    integer not null default 300,
  egg_price       integer not null default 50,
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  meal_records
--  meal_price / egg_price are snapshotted at insert time so historical
--  records are never affected by later price changes.
-- ---------------------------------------------------------------------
create table if not exists public.meal_records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  meal_type   text not null check (meal_type in ('breakfast', 'dinner')),
  meal_price  integer not null,
  egg_count   integer not null default 0 check (egg_count >= 0),
  egg_price   integer not null default 0,
  total_price integer not null,
  meal_date   date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- A user cannot record two breakfasts (or two dinners) on the same day.
  unique (user_id, meal_type, meal_date)
);

create index if not exists meal_records_user_idx on public.meal_records (user_id);
create index if not exists meal_records_date_idx on public.meal_records (meal_date);

-- ---------------------------------------------------------------------
--  settlements
-- ---------------------------------------------------------------------
create table if not exists public.settlements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  amount     integer not null check (amount >= 0),
  settled_at timestamptz not null default now(),
  notes      text
);

create index if not exists settlements_user_idx on public.settlements (user_id);

-- ---------------------------------------------------------------------
--  audit_logs
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete set null,
  action     text not null,        -- meal_added | meal_edited | meal_deleted | settlement_created | price_changed | user_added | user_disabled | pin_reset
  details    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------
--  keep updated_at fresh on meal_records
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists meal_records_touch on public.meal_records;
create trigger meal_records_touch
  before update on public.meal_records
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
--  Row Level Security
--  All access goes through Next.js API routes using the service role
--  key (which bypasses RLS). RLS is enabled with no permissive policies
--  so the anon/public key cannot read or write directly.
-- ---------------------------------------------------------------------
alter table public.users        enable row level security;
alter table public.settings     enable row level security;
alter table public.meal_records enable row level security;
alter table public.settlements  enable row level security;
alter table public.audit_logs   enable row level security;

-- ---------------------------------------------------------------------
--  Seed data
-- ---------------------------------------------------------------------
insert into public.settings (id, breakfast_price, dinner_price, egg_price)
values (1, 200, 300, 50)
on conflict (id) do nothing;

-- Initial users. pin_hash is NULL → each user sets their own PIN on first login.
insert into public.users (name, role) values
  ('Pavith',   'admin'),
  ('Nayantha', 'user'),
  ('Lahiru',   'user'),
  ('Bevin',    'user')
on conflict (name) do nothing;
