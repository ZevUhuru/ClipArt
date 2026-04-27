-- Fix: SELECT policy blocked anonymous rows (null = null is false in SQL)
-- Allow reading back your own row whether logged in or anonymous.
drop policy if exists "read own uses" on prompt_library_uses;

create policy "read own uses"
  on prompt_library_uses for select
  using (
    user_id = auth.uid()          -- authenticated: match by uid
    or
    (user_id is null and auth.uid() is null)  -- anonymous: allow null rows
  );
