-- Pack Studio V1 metadata and pricing fields.
-- These fields make packs seller-ready without changing the existing publish,
-- checkout, or ZIP download flows.

alter table public.packs
  add column if not exists audience text,
  add column if not exists pack_goal text,
  add column if not exists long_description text,
  add column if not exists whats_included text,
  add column if not exists use_cases text,
  add column if not exists license_summary text,
  add column if not exists compare_at_price_cents integer,
  add column if not exists launch_price_cents integer,
  add column if not exists launch_ends_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'packs_price_cents_nonnegative'
  ) then
    alter table public.packs
      add constraint packs_price_cents_nonnegative
      check (price_cents is null or price_cents >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'packs_compare_at_price_cents_nonnegative'
  ) then
    alter table public.packs
      add constraint packs_compare_at_price_cents_nonnegative
      check (compare_at_price_cents is null or compare_at_price_cents >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'packs_launch_price_cents_nonnegative'
  ) then
    alter table public.packs
      add constraint packs_launch_price_cents_nonnegative
      check (launch_price_cents is null or launch_price_cents >= 0);
  end if;
end $$;
