-- Pack release notifications.
-- Lets admins manually or automatically announce new pack drops to all users.

create table if not exists public.pack_release_notifications (
  id uuid primary key default gen_random_uuid(),
  release_key text not null unique,
  pack_id uuid references public.packs(id) on delete set null,
  title text not null,
  badge_label text not null default 'New drop',
  description text,
  target_path text not null default '/packs',
  launch_mode text not null default 'manual',
  is_active boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pack_release_notifications_launch_mode_check
    check (launch_mode in ('manual', 'auto')),
  constraint pack_release_notifications_target_path_check
    check (target_path like '/%')
);

create index if not exists idx_pack_release_notifications_active
  on public.pack_release_notifications (is_active, starts_at desc);

create index if not exists idx_pack_release_notifications_pack_id
  on public.pack_release_notifications (pack_id);

create or replace function pack_release_notifications_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pack_release_notifications_updated_at
  on public.pack_release_notifications;

create trigger trg_pack_release_notifications_updated_at
  before update on public.pack_release_notifications
  for each row execute function pack_release_notifications_updated_at();

alter table public.pack_release_notifications enable row level security;

create policy "Service can manage pack release notifications"
  on public.pack_release_notifications for all
  using (true) with check (true);

notify pgrst, 'reload schema';

