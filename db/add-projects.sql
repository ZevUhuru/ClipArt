-- Projects: user-owned folders + animation shorts
-- project_type = 'collection' | 'short'

CREATE TABLE IF NOT EXISTS public.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  project_type    text NOT NULL DEFAULT 'collection'
                    CHECK (project_type IN ('collection', 'short')),
  cover_image_url text,
  item_count      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- project_items: assets in a collection OR shots in a short
-- item_type = 'asset' (image/animation in collection)
--           | 'shot'  (storyboard shot with source image + optional animation + prompt)

CREATE TABLE IF NOT EXISTS public.project_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_type      text NOT NULL DEFAULT 'asset'
                   CHECK (item_type IN ('asset', 'shot')),

  -- For 'asset' items: link to a generation OR animation
  generation_id  uuid REFERENCES public.generations(id) ON DELETE CASCADE,
  animation_id   uuid REFERENCES public.animations(id) ON DELETE CASCADE,

  -- Ordering and notes (for shots, note stores the motion prompt)
  position       integer,
  note           text,

  added_at       timestamptz NOT NULL DEFAULT now(),

  -- Asset must reference exactly one item; shot must reference at least a generation
  CONSTRAINT valid_item_refs CHECK (
    (item_type = 'asset'
      AND (
        (generation_id IS NOT NULL AND animation_id IS NULL)
        OR (generation_id IS NULL AND animation_id IS NOT NULL)
      )
    )
    OR
    (item_type = 'shot' AND generation_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_project_items_project_id ON public.project_items(project_id);

-- Row-level security

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own project items"
  ON public.project_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own project items"
  ON public.project_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own project items"
  ON public.project_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own project items"
  ON public.project_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION public.touch_project_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_project_updated_at();
