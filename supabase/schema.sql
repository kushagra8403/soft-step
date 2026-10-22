-- Soft Steps orders. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Row Level Security is switched on with no policies, so the public (anon) key can never read or
-- write this table. Only the Netlify Functions can, using the secret service key.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  oid text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  phone text not null,
  address text not null,
  city text not null,
  pin text not null,
  items jsonb not null,
  total integer not null,
  note text,
  status text not null default 'received'
    check (status in ('received','confirmed','packed','shipped','delivered','cancelled')),
  status_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);
alter table public.orders enable row level security;
