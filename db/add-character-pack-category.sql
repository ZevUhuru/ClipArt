-- Character pack category
-- Run this in Supabase SQL Editor after db/add-packs.sql.

INSERT INTO public.categories (
  slug,
  name,
  h1,
  meta_title,
  meta_description,
  intro,
  seo_content,
  suggested_prompts,
  related_slugs,
  sort_order,
  type
) VALUES (
  'characters',
  'Characters',
  'Character Clip Art Packs',
  'Character Clip Art Packs & Reference Sheet Bundles | clip.art',
  'Browse character clip art packs, reference sheets, pose sets, expression packs, and themed character bundles from clip.art.',
  'Character bundles collect reusable reference sheets, poses, expressions, outfits, props, and story-ready clip art under cohesive named identities.',
  ARRAY[
    'Character packs help creators keep one identity consistent across reference sheets, expressions, poses, props, coloring pages, worksheets, and story scenes.'
  ],
  ARRAY[
    'Vintage fox detective reference sheet',
    'Character expression pack',
    'Storybook mascot pose set'
  ],
  ARRAY['education', 'animals'],
  106,
  'pack'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  h1 = EXCLUDED.h1,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  intro = EXCLUDED.intro,
  seo_content = EXCLUDED.seo_content,
  suggested_prompts = EXCLUDED.suggested_prompts,
  related_slugs = EXCLUDED.related_slugs,
  sort_order = EXCLUDED.sort_order,
  type = EXCLUDED.type;

