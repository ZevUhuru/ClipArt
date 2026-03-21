-- Admin CMS migration
-- Run this in the Supabase SQL Editor

-- 1. Drop old legacy categories table and recreate with new schema
DROP TABLE IF EXISTS public.categories CASCADE;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  h1 text NOT NULL,
  meta_title text,
  meta_description text,
  intro text,
  seo_content text[] DEFAULT '{}',
  suggested_prompts text[] DEFAULT '{}',
  related_slugs text[] DEFAULT '{}',
  image_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active categories"
  ON public.categories FOR SELECT USING (is_active = true);

CREATE POLICY "Service can manage categories"
  ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_categories_slug ON public.categories (slug);
CREATE INDEX idx_categories_active ON public.categories (is_active, sort_order);

-- 2. Add is_admin to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 3. Add slug + description to generations
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_generations_slug
  ON public.generations (slug) WHERE slug IS NOT NULL;

-- 4. Seed the 10 existing categories
INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, intro, seo_content, suggested_prompts, related_slugs, sort_order) VALUES
  ('christmas', 'Christmas', 'Christmas Clip Art',
   'Christmas Clip Art — Free AI Generated Christmas Images',
   'Browse and generate beautiful Christmas clip art. Santa, reindeer, ornaments, and more. Create your own in seconds with AI.',
   'From jolly Santas to glittering ornaments, find the perfect Christmas clip art for your holiday cards, classroom projects, and festive designs. Or generate your own with AI in seconds.',
   ARRAY['Christmas clip art is one of the most searched visual assets every holiday season. Teachers use it for classroom decorations, parents for holiday cards, and small businesses for seasonal marketing materials. Whether you need a classic Santa Claus, a whimsical reindeer, or elegant snowflake designs, quality Christmas clip art brings warmth and cheer to any project.', 'With clip.art''s AI generator, you can create unique Christmas illustrations in any style — from flat vector designs perfect for print to detailed sticker-style artwork. Simply describe what you want, choose a style, and download your custom Christmas clip art instantly.'],
   ARRAY['Santa Claus riding a sleigh through a snowy sky', 'Decorated Christmas tree with colorful ornaments', 'Cute reindeer wearing a red scarf'],
   ARRAY['thanksgiving', 'pumpkin', 'heart', 'flower'], 1),

  ('heart', 'Heart', 'Heart Clip Art',
   'Heart Clip Art — Free AI Generated Heart Images',
   'Browse and generate heart clip art for Valentine''s Day, love notes, and designs. Create custom heart illustrations with AI instantly.',
   'Red hearts, pink hearts, heart patterns, and love-themed illustrations — find the perfect heart clip art for Valentine''s Day cards, wedding invitations, and romantic designs.',
   ARRAY['Heart clip art is a timeless staple for Valentine''s Day cards, wedding stationery, love letters, and social media graphics. From simple red hearts to intricate floral heart designs, this versatile shape works across every style and occasion.', 'Generate custom heart clip art in any aesthetic you can imagine. Want a watercolor heart with roses? A geometric heart pattern? A cute cartoon heart character? Describe it and our AI will create it for you in seconds.'],
   ARRAY['Watercolor red heart with delicate floral border', 'Cute cartoon heart character with a smile', 'Elegant gold heart with flourish decorations'],
   ARRAY['flower', 'christmas', 'cat', 'free'], 2),

  ('halloween', 'Halloween', 'Halloween Clip Art',
   'Halloween Clip Art — Free AI Generated Spooky Images',
   'Browse and generate Halloween clip art. Pumpkins, ghosts, witches, and more. Create custom spooky illustrations with AI.',
   'Spooky pumpkins, friendly ghosts, wicked witches, and creepy haunted houses — get the Halloween clip art you need for party invitations, classroom decorations, and trick-or-treat flyers.',
   ARRAY['Halloween clip art sets the mood for the spookiest time of year. Teachers love it for October classroom activities, parents use it for party invitations, and businesses need it for seasonal promotions. From kid-friendly cartoon ghosts to detailed horror-style illustrations, Halloween clip art covers the full range from cute to creepy.', 'Our AI generator can create any Halloween scene you can describe. Need a black cat sitting on a jack-o-lantern under a full moon? A group of trick-or-treaters in costumes? A haunted mansion with bats? Just type your idea, pick a style, and download.'],
   ARRAY['Cute ghost holding a trick-or-treat basket', 'Spooky haunted house on a hill with full moon', 'Jack-o-lantern with a silly carved face glowing orange'],
   ARRAY['pumpkin', 'cat', 'thanksgiving', 'christmas'], 3),

  ('free', 'Free', 'Free Clip Art',
   'Free Clip Art — Download Free AI Generated Images',
   'Download free clip art for any project. Generate custom illustrations with AI at no cost. No attribution required.',
   'Get free clip art for school projects, presentations, social media, and more. Every visitor gets 5 free AI generations — no sign-up required. Create exactly what you need.',
   ARRAY['Finding quality free clip art has always been a challenge. Most free clip art sites serve outdated, low-quality images with restrictive licenses. clip.art changes that by letting you generate exactly the clip art you need, for free, with no attribution required.', 'Every visitor gets 5 free generations with no account needed. Sign up for 5 more free credits. Each generation creates a unique, high-quality PNG image tailored to your description. Whether you need clip art for a school report, a business presentation, or a social media post, you can create it here in seconds.'],
   ARRAY['Colorful stack of books for a school project', 'Professional handshake business illustration', 'Happy birthday cake with candles and confetti'],
   ARRAY['school', 'book', 'flower', 'heart'], 4),

  ('flower', 'Flower', 'Flower Clip Art',
   'Flower Clip Art — Free AI Generated Floral Images',
   'Browse and generate beautiful flower clip art. Roses, sunflowers, bouquets, and more. Create custom floral illustrations with AI.',
   'Roses, sunflowers, tulips, and wildflower bouquets — find gorgeous flower clip art for invitations, greeting cards, scrapbooking, and digital designs.',
   ARRAY['Flower clip art is one of the most versatile visual assets available. It''s used in wedding invitations, Mother''s Day cards, spring classroom decorations, garden blogs, and everything in between. From realistic botanical illustrations to simple flat-style blooms, flower clip art adds beauty and elegance to any project.', 'With our AI generator, you can create flower clip art in any style imaginable. Request a vintage botanical rose illustration, a kawaii cartoon sunflower, or a minimalist line-art daisy. The possibilities are endless, and every image is uniquely generated for you.'],
   ARRAY['Beautiful bouquet of pink roses with green leaves', 'Single sunflower with a happy cartoon face', 'Watercolor wildflower meadow with butterflies'],
   ARRAY['heart', 'cat', 'book', 'free'], 5),

  ('school', 'School', 'School Clip Art',
   'School Clip Art — Free AI Generated Education Images',
   'Browse and generate school clip art. Classroom supplies, teachers, students, and more. Perfect for worksheets and presentations.',
   'Pencils, books, chalkboards, and school buses — find the school clip art teachers and students need for worksheets, presentations, bulletin boards, and classroom projects.',
   ARRAY['School clip art is essential for educators everywhere. Teachers use it to brighten worksheets, create engaging presentations, decorate bulletin boards, and build visual learning materials. Students reach for it when illustrating reports and projects. From ABC blocks to graduation caps, school clip art covers the entire academic journey.', 'Generate the exact school clip art you need with AI. Describe a classroom scene, a specific school supply, or an educational concept, and get a custom illustration in seconds. Perfect for back-to-school season, end-of-year celebrations, and everything in between.'],
   ARRAY['Colorful classroom with desks, chalkboard, and globe', 'Happy school bus filled with smiling children', 'Stack of textbooks with an apple on top'],
   ARRAY['book', 'free', 'thanksgiving', 'cat'], 6),

  ('book', 'Book', 'Book Clip Art',
   'Book Clip Art — Free AI Generated Book Images',
   'Browse and generate book clip art. Open books, libraries, reading scenes, and more. Create custom book illustrations with AI.',
   'Open books, towering bookshelves, cozy reading nooks, and magical storybooks — find book clip art perfect for library displays, reading programs, and educational materials.',
   ARRAY['Book clip art is a staple for libraries, schools, literacy programs, and publishing. Whether you need a simple open book icon for a worksheet or an elaborate fantasy storybook illustration for a reading challenge poster, quality book clip art makes learning and reading feel inviting.', 'Our AI generator creates unique book illustrations tailored to your needs. Request a stack of vintage leather-bound books, an open book with pages flying out, or a child reading under a tree. Every generation is unique and ready to download as a high-quality PNG.'],
   ARRAY['Open book with magical sparkles flying from the pages', 'Cozy reading nook with stack of colorful books', 'Vintage leather-bound book with gold decorations'],
   ARRAY['school', 'free', 'cat', 'flower'], 7),

  ('pumpkin', 'Pumpkin', 'Pumpkin Clip Art',
   'Pumpkin Clip Art — Free AI Generated Pumpkin Images',
   'Browse and generate pumpkin clip art. Jack-o-lanterns, fall harvest, and autumn designs. Create custom pumpkin illustrations with AI.',
   'Jack-o-lanterns, autumn harvest pumpkins, pumpkin patches, and fall decorations — find the pumpkin clip art you need for Halloween parties, Thanksgiving crafts, and autumn projects.',
   ARRAY['Pumpkin clip art peaks in demand from September through November, spanning both Halloween and Thanksgiving seasons. From carved jack-o-lanterns with glowing faces to wholesome harvest pumpkins in autumn colors, this versatile clip art works across fall-themed projects, seasonal marketing, and classroom activities.', 'Generate unique pumpkin illustrations with AI. Describe a cute pumpkin character, a spooky carved jack-o-lantern, or an autumn harvest scene with pumpkins, hay bales, and falling leaves. Choose from flat, cartoon, sticker, and vintage styles to match your project.'],
   ARRAY['Cute pumpkin character with a happy face and autumn leaves', 'Carved jack-o-lantern glowing in the dark', 'Autumn harvest scene with pumpkins, hay, and sunflowers'],
   ARRAY['halloween', 'thanksgiving', 'christmas', 'flower'], 8),

  ('cat', 'Cat', 'Cat Clip Art',
   'Cat Clip Art — Free AI Generated Cat Images',
   'Browse and generate adorable cat clip art. Kittens, cartoon cats, and feline illustrations. Create custom cat images with AI.',
   'Playful kittens, sleeping cats, cartoon felines, and realistic cat portraits — find the purr-fect cat clip art for pet projects, greeting cards, and social media.',
   ARRAY['Cat clip art is perennially popular — cats dominate the internet, and their illustrated counterparts are just as beloved. From adorable kitten sketches for pet adoption flyers to elegant cat silhouettes for art projects, cat clip art serves a wide range of creative needs.', 'Create the exact cat illustration you envision with our AI generator. Describe a kitten playing with yarn, a cat wearing a top hat, or a realistic Siamese portrait. With five distinct styles from flat vector to vintage illustration, you''ll find the perfect look for your project.'],
   ARRAY['Cute kitten playing with a ball of yarn', 'Fat orange tabby cat sleeping in a sunbeam', 'Elegant black cat silhouette with glowing green eyes'],
   ARRAY['flower', 'heart', 'halloween', 'free'], 9),

  ('thanksgiving', 'Thanksgiving', 'Thanksgiving Clip Art',
   'Thanksgiving Clip Art — Free AI Generated Thanksgiving Images',
   'Browse and generate Thanksgiving clip art. Turkeys, harvest scenes, pilgrim hats, and fall feasts. Create custom images with AI.',
   'Turkeys, cornucopias, pilgrim hats, and fall feasts — find Thanksgiving clip art for holiday cards, classroom activities, and dinner party invitations.',
   ARRAY['Thanksgiving clip art brings warmth and gratitude to holiday projects. Teachers use it for November classroom activities and gratitude journals, families add it to dinner invitations and place cards, and businesses incorporate it into seasonal marketing. From cartoon turkeys to elegant harvest cornucopias, the right Thanksgiving clip art sets the festive tone.', 'Generate custom Thanksgiving illustrations that match your vision. Describe a family gathered around a turkey dinner, a cute pilgrim hat with fall leaves, or a harvest scene with pumpkins and corn. Our AI creates unique artwork in seconds — no stock photo hunting required.'],
   ARRAY['Cute cartoon turkey wearing a pilgrim hat', 'Thanksgiving dinner table with turkey and all the sides', 'Cornucopia overflowing with fall harvest fruits and vegetables'],
   ARRAY['christmas', 'pumpkin', 'halloween', 'free'], 10)
ON CONFLICT (slug) DO NOTHING;
