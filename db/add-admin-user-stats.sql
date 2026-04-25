-- View used by the admin Users table to surface per-user activity.
-- Lets us read generation counts and "last generation at" without N+1 queries
-- or client-side aggregation across the full generations table.

create or replace view public.admin_user_stats as
select
  p.id,
  count(g.id) as generation_count,
  max(g.created_at) as last_generation_at
from public.profiles p
left join public.generations g on g.user_id = p.id
group by p.id;

-- Allow the service-role admin client to read this view.
-- (Anon/auth roles do not get access; admin pages use the service-role client.)
grant select on public.admin_user_stats to service_role;
