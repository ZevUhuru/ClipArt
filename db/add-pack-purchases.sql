-- Paid pack purchase entitlements
-- Run this in the Supabase SQL Editor before enabling paid pack checkout.

create table if not exists public.pack_purchases (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.packs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  buyer_email text,
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'paid',
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pack_purchases_amount_nonnegative check (amount_cents >= 0),
  constraint pack_purchases_download_count_nonnegative check (download_count >= 0),
  constraint pack_purchases_status_valid check (status in ('paid', 'refunded', 'disputed'))
);

create index if not exists idx_pack_purchases_pack_id
  on public.pack_purchases(pack_id);

create index if not exists idx_pack_purchases_user_id
  on public.pack_purchases(user_id)
  where user_id is not null;

create index if not exists idx_pack_purchases_buyer_email
  on public.pack_purchases(lower(buyer_email))
  where buyer_email is not null;

create index if not exists idx_pack_purchases_pack_user
  on public.pack_purchases(pack_id, user_id)
  where user_id is not null;

create or replace function public.pack_purchases_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pack_purchases_updated_at on public.pack_purchases;
create trigger trg_pack_purchases_updated_at
  before update on public.pack_purchases
  for each row execute function public.pack_purchases_updated_at();

alter table public.pack_purchases enable row level security;

-- All reads/writes currently go through service-role server routes.
-- Client-facing access is intentionally not exposed in V1.

notify pgrst, 'reload schema';
