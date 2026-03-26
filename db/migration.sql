-- clip.art v2 — Supabase schema
-- Run this in the Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits integer not null default 10,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 10);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generations
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  prompt text not null,
  style text not null,
  image_url text not null,
  aspect_ratio text not null default '1:1',
  created_at timestamptz default now()
);

alter table public.generations enable row level security;

create policy "Users read own generations"
  on generations for select
  using (auth.uid() = user_id);

create policy "Service insert generations"
  on generations for insert
  with check (true);

create index if not exists idx_generations_user_id on generations(user_id);
create index if not exists idx_generations_created_at on generations(created_at desc);

-- Purchases
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  stripe_session_id text unique not null,
  credits_added integer not null,
  amount_cents integer not null,
  created_at timestamptz default now()
);

alter table public.purchases enable row level security;

create policy "Service insert purchases"
  on purchases for insert
  with check (true);
