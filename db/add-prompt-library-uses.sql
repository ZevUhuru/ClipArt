-- Track which prompts users click in the Prompt Library
create table if not exists prompt_library_uses (
  id          bigint generated always as identity primary key,
  used_at     timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete set null,
  prompt_text text        not null,
  category    text        not null,
  style       text        not null,
  difficulty  text        not null
);

-- Index for analytics queries (most used prompts, top categories, etc.)
create index if not exists prompt_library_uses_used_at_idx  on prompt_library_uses (used_at desc);
create index if not exists prompt_library_uses_category_idx on prompt_library_uses (category);
create index if not exists prompt_library_uses_style_idx    on prompt_library_uses (style);

-- Anyone can insert their own use; only the owner can read their own rows
alter table prompt_library_uses enable row level security;

create policy "insert own use"
  on prompt_library_uses for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "read own uses"
  on prompt_library_uses for select
  using (user_id = auth.uid());
