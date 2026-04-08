-- Packs / Bundles feature
-- Run this in the Supabase SQL Editor

-- 1. Packs table
CREATE TABLE IF NOT EXISTS public.packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  cover_image_url text,
  zip_url text,
  zip_status text NOT NULL DEFAULT 'pending',
  item_count integer NOT NULL DEFAULT 0,
  content_types text[] DEFAULT '{}',
  formats text[] DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'private',
  is_free boolean NOT NULL DEFAULT true,
  price_cents integer,
  stripe_price_id text,
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  downloads integer NOT NULL DEFAULT 0,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_visibility CHECK (visibility IN ('private', 'public')),
  CONSTRAINT valid_zip_status CHECK (zip_status IN ('pending', 'building', 'ready', 'failed'))
);

-- 2. Pack items join table
CREATE TABLE IF NOT EXISTS public.pack_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  generation_id uuid NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  is_exclusive boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_pack_generation UNIQUE (pack_id, generation_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_packs_user_id ON public.packs(user_id);
CREATE INDEX IF NOT EXISTS idx_packs_slug ON public.packs(slug);
CREATE INDEX IF NOT EXISTS idx_packs_category_id ON public.packs(category_id);
CREATE INDEX IF NOT EXISTS idx_packs_published_public
  ON public.packs(created_at DESC)
  WHERE is_published = true AND visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_packs_featured
  ON public.packs(downloads DESC)
  WHERE is_featured = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_packs_search
  ON public.packs USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_pack_items_pack_id ON public.pack_items(pack_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_pack_items_generation_id ON public.pack_items(generation_id);

-- 4. Full-text search trigger
CREATE OR REPLACE FUNCTION packs_search_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_packs_search ON public.packs;
CREATE TRIGGER trg_packs_search
  BEFORE INSERT OR UPDATE ON public.packs
  FOR EACH ROW EXECUTE FUNCTION packs_search_update();

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION packs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_packs_updated_at ON public.packs;
CREATE TRIGGER trg_packs_updated_at
  BEFORE UPDATE ON public.packs
  FOR EACH ROW EXECUTE FUNCTION packs_updated_at();

-- 6. RLS for packs
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published public packs"
  ON public.packs FOR SELECT
  USING (is_published = true AND visibility = 'public');

CREATE POLICY "Users can read own packs"
  ON public.packs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own packs"
  ON public.packs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packs"
  ON public.packs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own packs"
  ON public.packs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all packs"
  ON public.packs FOR ALL
  USING (true) WITH CHECK (true);

-- 7. RLS for pack_items
ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read items of published public packs"
  ON public.pack_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.packs
      WHERE packs.id = pack_items.pack_id
        AND packs.is_published = true
        AND packs.visibility = 'public'
    )
  );

CREATE POLICY "Users can read own pack items"
  ON public.pack_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.packs
      WHERE packs.id = pack_items.pack_id
        AND packs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to own packs"
  ON public.pack_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.packs
      WHERE packs.id = pack_items.pack_id
        AND packs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in own packs"
  ON public.pack_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.packs
      WHERE packs.id = pack_items.pack_id
        AND packs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from own packs"
  ON public.pack_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.packs
      WHERE packs.id = pack_items.pack_id
        AND packs.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage all pack items"
  ON public.pack_items FOR ALL
  USING (true) WITH CHECK (true);

-- 8. Seed pack categories
INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, intro, seo_content, suggested_prompts, related_slugs, sort_order, type) VALUES
  ('spring', 'Spring', 'Spring Clip Art Packs',
   'Free Spring Clip Art Bundles & Design Packs | clip.art',
   'Download free spring clip art bundles. Flowers, gardens, butterflies, and Easter themes. AI-generated SVG and PNG packs for crafting and design.',
   'Fresh spring-themed clip art collections featuring flowers, gardens, butterflies, and seasonal designs — perfect for crafting, teaching, and design projects.',
   ARRAY['Spring is one of the most popular seasons for clip art demand. Teachers prepare classroom materials, crafters stock up on seasonal designs, and businesses refresh their marketing with spring themes.'],
   ARRAY['Spring flower bouquet collection', 'Easter bunny and eggs set', 'Butterfly garden illustration pack'],
   ARRAY['animals', 'holidays', 'education'], 100, 'pack'),

  ('animals', 'Animals', 'Animal Clip Art Packs',
   'Free Animal Clip Art Bundles & Design Packs | clip.art',
   'Download free animal clip art bundles. Farm animals, wildlife, pets, and ocean creatures. AI-generated SVG and PNG packs.',
   'Adorable animal clip art collections featuring farm animals, wildlife, pets, and sea creatures — great for kids activities, educational materials, and creative projects.',
   ARRAY['Animal clip art is a perennial favorite for educational materials, children''s projects, and decorative crafting. From cute farm animals to majestic wildlife, these packs cover every creature.'],
   ARRAY['Farm animals collection', 'Ocean creatures set', 'Cute pets illustration pack'],
   ARRAY['education', 'spring', 'holidays'], 101, 'pack'),

  ('holidays', 'Holidays', 'Holiday Clip Art Packs',
   'Free Holiday Clip Art Bundles & Design Packs | clip.art',
   'Download free holiday clip art bundles. Christmas, Halloween, Thanksgiving, Valentine''s Day and more. AI-generated SVG and PNG packs.',
   'Festive holiday clip art collections for every celebration — Christmas, Halloween, Thanksgiving, Valentine''s Day, Easter, and more.',
   ARRAY['Holiday clip art drives seasonal search traffic year-round. Each holiday brings a wave of demand for themed clip art packs for cards, decorations, classroom activities, and social media.'],
   ARRAY['Christmas decoration set', 'Halloween spooky collection', 'Valentine''s Day hearts pack'],
   ARRAY['spring', 'education', 'wedding'], 102, 'pack'),

  ('education', 'Education', 'Education Clip Art Packs',
   'Free Education Clip Art Bundles & Design Packs | clip.art',
   'Download free education clip art bundles. School supplies, classroom themes, STEM, and back-to-school designs. AI-generated SVG and PNG packs.',
   'Educational clip art collections for teachers and students — school supplies, classroom themes, STEM subjects, and back-to-school essentials.',
   ARRAY['Education clip art is in constant demand from teachers creating worksheets, presentations, bulletin boards, and classroom decorations. Bundled packs save time by providing cohesive themed sets.'],
   ARRAY['Back-to-school supplies set', 'Science and STEM collection', 'Alphabet and numbers pack'],
   ARRAY['animals', 'holidays', 'spring'], 103, 'pack'),

  ('wedding', 'Wedding', 'Wedding Clip Art Packs',
   'Free Wedding Clip Art Bundles & Design Packs | clip.art',
   'Download free wedding clip art bundles. Floral frames, invitations, love themes, and bridal designs. AI-generated SVG and PNG packs.',
   'Elegant wedding clip art collections featuring floral frames, romantic motifs, and bridal designs — perfect for invitations, save-the-dates, and wedding stationery.',
   ARRAY['Wedding clip art is a high-value niche with strong demand for invitations, save-the-dates, table numbers, and wedding programs. Cohesive bundled sets ensure a consistent aesthetic across all wedding materials.'],
   ARRAY['Floral wedding invitation frames', 'Romantic couple illustrations', 'Wedding decoration elements'],
   ARRAY['spring', 'holidays'], 104, 'pack'),

  ('food', 'Food & Cooking', 'Food & Cooking Clip Art Packs',
   'Free Food & Cooking Clip Art Bundles & Design Packs | clip.art',
   'Download free food and cooking clip art bundles. Kitchen items, recipes, fruits, vegetables, and baking themes. AI-generated SVG and PNG packs.',
   'Delicious food and cooking clip art collections featuring kitchen items, ingredients, baking themes, and recipe illustrations.',
   ARRAY['Food and cooking clip art is popular for recipe blogs, restaurant menus, cookbook illustrations, and nutrition education materials. Themed bundles provide cohesive sets for specific cuisines or cooking themes.'],
   ARRAY['Baking and pastry collection', 'Fresh fruits and vegetables set', 'Kitchen utensils illustration pack'],
   ARRAY['holidays', 'education'], 105, 'pack')
ON CONFLICT (slug) DO NOTHING;
