-- Track "last seen" on profiles so the admin Users table reflects real activity,
-- not just sign-in events.
--
-- Background: auth.users.last_sign_in_at is only updated by Supabase on an actual
-- sign-in (password / OAuth / magic-link). A returning user whose session refreshes
-- silently never updates that field, so the admin UI showed stale values for anyone
-- with a persistent session. We track our own timestamp, bumped on every
-- authenticated request from middleware (throttled via cookie to ~5 min).

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Seed initial values from auth.users.last_sign_in_at so existing rows aren't blank.
update public.profiles p
set last_seen_at = u.last_sign_in_at
from auth.users u
where p.id = u.id
  and p.last_seen_at is null
  and u.last_sign_in_at is not null;

create index if not exists profiles_last_seen_at_idx
  on public.profiles (last_seen_at desc nulls last);
