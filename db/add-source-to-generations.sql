-- Attribution: track which generations originated from the Prompt Library
alter table generations
  add column if not exists source              text,
  add column if not exists prompt_library_use_id bigint
    references prompt_library_uses(id) on delete set null;

create index if not exists generations_source_idx
  on generations (source);
create index if not exists generations_prompt_library_use_id_idx
  on generations (prompt_library_use_id);
