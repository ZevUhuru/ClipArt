-- Flower SEO Pages: clip art species + B&W category + coloring theme
-- Run this in Supabase SQL editor.

-- ─────────────────────────────────────────────
-- 1. Clip art species categories (type = 'clipart')
-- ─────────────────────────────────────────────

INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, intro, seo_content, suggested_prompts, related_slugs, sort_order, type)
VALUES
  (
    'hibiscus',
    'Hibiscus',
    'Hibiscus Clip Art',
    'Free Hibiscus Clip Art — AI Hibiscus Images | clip.art',
    'Browse and download free hibiscus clip art. Tropical hibiscus flowers in every color and style. Generate custom hibiscus illustrations with AI instantly.',
    'From vibrant Hawaiian hibiscus to delicate garden varieties, find the perfect hibiscus clip art for invitations, party decorations, and tropical designs — or generate your own with AI in seconds.',
    ARRAY[
      'Hibiscus clip art is one of the most searched flower types online, beloved for its bold, trumpet-shaped blooms and association with tropical paradise. The hibiscus is the state flower of Hawaii and a symbol of beauty and welcome across the Pacific Islands. Its dramatic five-petal form and vivid color range — from crimson and hot pink to sunny yellow and pure white — make it one of the most visually striking flowers to use in design.',
      'Whether you need hibiscus images for a luau invitation, a Hawaii-themed birthday party, a spa branding project, or a tropical summer design, our AI generator creates custom hibiscus illustrations in any style. Choose from flat vector designs, watercolor renderings, sticker-style artwork, or detailed botanical illustrations. Download your custom hibiscus clip art instantly, free for personal and commercial use.'
    ],
    ARRAY[
      'Pink hibiscus flower with detailed stamens on transparent background',
      'Hawaiian hibiscus wreath with tropical leaves',
      'Cute cartoon hibiscus flower smiling'
    ],
    ARRAY['flower', 'lotus', 'tropical-flower', 'daisy'],
    20,
    'clipart'
  ),
  (
    'lotus',
    'Lotus',
    'Lotus Flower Clip Art',
    'Free Lotus Flower Clip Art — AI Lotus Images | clip.art',
    'Browse and download free lotus flower clip art. Sacred lotus blooms in every style. Generate custom lotus illustrations with AI instantly.',
    'Find serene lotus flower clip art for yoga studios, meditation apps, wellness branding, and spiritual designs — or generate your own custom lotus illustration with AI.',
    ARRAY[
      'Lotus flower clip art holds deep symbolic meaning across cultures. In Buddhism and Hinduism, the lotus represents purity, enlightenment, and spiritual awakening — a flower that rises from muddy waters to bloom in perfect beauty. This powerful symbolism makes lotus imagery one of the most popular choices for wellness brands, yoga studios, meditation apps, tattoo designs, and spiritual artwork.',
      'Our AI lotus generator creates custom lotus illustrations in any style you need. From minimalist line art perfect for logos and branding to detailed botanical illustrations, intricate mandala-style lotus designs, or soft watercolor renderings for print, describe your vision and get a unique lotus clip art in seconds. All images download instantly, free for personal and commercial use.'
    ],
    ARRAY[
      'Lotus flower blooming on a still pond at sunrise',
      'Minimalist lotus line art for yoga branding',
      'Detailed mandala lotus flower with intricate petals'
    ],
    ARRAY['flower', 'hibiscus', 'lily', 'daisy'],
    21,
    'clipart'
  ),
  (
    'lily',
    'Lily',
    'Lily Clip Art',
    'Free Lily Clip Art — AI Generated Lily Images | clip.art',
    'Browse and download free lily clip art. Tiger lilies, calla lilies, water lilies in every style. Generate custom lily illustrations with AI instantly.',
    'From elegant calla lilies to vibrant tiger lilies, find the perfect lily clip art for weddings, sympathy cards, garden designs, and floral arrangements.',
    ARRAY[
      'Lily clip art covers one of the most diverse flower families in the botanical world. Calla lilies are a staple of wedding invitations and formal occasions with their elegant trumpet shape and pure white coloring. Tiger lilies bring bold orange color and dramatic spotted patterns to summer designs. Water lilies evoke peaceful garden ponds and Asian-inspired aesthetics. Easter lilies symbolize hope and renewal for spring celebrations.',
      'Whatever variety of lily you need, our AI generator creates custom lily illustrations tailored to your project. Generate a delicate white calla lily for a wedding program, a vibrant orange tiger lily for a garden illustration, or an intricate water lily for a nature-inspired design. Every lily clip art downloads instantly with a transparent background, free for personal and commercial use.'
    ],
    ARRAY[
      'Elegant white calla lily with long green stem',
      'Tiger lily with vibrant orange petals and spots',
      'Pink water lily floating on a calm pond'
    ],
    ARRAY['flower', 'lotus', 'daisy', 'tulip'],
    22,
    'clipart'
  ),
  (
    'daisy',
    'Daisy',
    'Daisy Clip Art',
    'Free Daisy Clip Art — AI Generated Daisy Images | clip.art',
    'Browse and download free daisy clip art. Classic white daisies, sunflowers, and wildflower daisies in every style. Generate custom daisy illustrations with AI instantly.',
    'Cheerful daisies for spring projects, children''s designs, garden illustrations, and wildflower arrangements — browse our daisy clip art gallery or generate your own in seconds.',
    ARRAY[
      'Daisy clip art captures the simple, cheerful charm of one of the world''s most beloved wildflowers. The classic white daisy with its yellow center is instantly recognizable and works beautifully across a wide range of design projects — from children''s birthday invitations and spring classroom decorations to garden party themes and wholesome branding. Daisies convey innocence, happiness, and fresh beginnings.',
      'Our AI daisy generator creates custom daisy illustrations in any style. Want a whimsical cartoon daisy with a happy face for a kids'' party? A detailed botanical daisy illustration for a garden journal? A field of daisies for a spring greeting card? Describe your vision and get unique daisy clip art in seconds, ready to download with a transparent background.'
    ],
    ARRAY[
      'Bunch of white daisies with yellow centers tied with a ribbon',
      'Cute cartoon daisy with a smiley face',
      'Field of daisies in a sunny meadow with butterflies'
    ],
    ARRAY['flower', 'lily', 'tulip', 'lotus'],
    23,
    'clipart'
  ),
  (
    'rose',
    'Rose',
    'Rose Clip Art',
    'Free Rose Clip Art — AI Generated Rose Images | clip.art',
    'Browse and download free rose clip art. Red roses, pink roses, rose bouquets and more. Generate custom rose illustrations with AI instantly.',
    'The most iconic flower in the world — find beautiful rose clip art for Valentine''s Day, weddings, anniversaries, and romantic designs, or create your own with AI.',
    ARRAY[
      'Rose clip art is synonymous with love, romance, and beauty across virtually every culture. The red rose in particular is the universal symbol of love, making rose imagery essential for Valentine''s Day cards, wedding invitations, anniversary gifts, and romantic branding. Beyond red, roses come in an extraordinary variety — blush pink roses for weddings, yellow roses for friendship, white roses for purity, and deep purple roses for enchantment.',
      'Our AI rose generator creates stunning rose illustrations in any style you can imagine. From a single perfect red rose with dewdrops for a romantic card to a full bouquet of watercolor roses for a wedding invitation, a vintage botanical rose illustration for elegant branding, or a cute cartoon rose for a children''s project — describe it and get unique rose clip art instantly, free to download and use.'
    ],
    ARRAY[
      'Single red rose with dew drops on dark background',
      'Bouquet of pink roses tied with a white ribbon',
      'Vintage botanical rose illustration with stem and leaves'
    ],
    ARRAY['flower', 'heart', 'daisy', 'tulip'],
    24,
    'clipart'
  ),
  (
    'tulip',
    'Tulip',
    'Tulip Clip Art',
    'Free Tulip Clip Art — AI Generated Tulip Images | clip.art',
    'Browse and download free tulip clip art. Classic tulips in every color and style. Generate custom tulip illustrations with AI instantly.',
    'Bright, cup-shaped, and instantly springlike — find tulip clip art for Easter projects, spring designs, Dutch-themed illustrations, and garden scenes.',
    ARRAY[
      'Tulip clip art is a cornerstone of spring design. These clean, cup-shaped blooms in their signature colors — fire red, sunshine yellow, soft pink, and deep purple — are immediately associated with springtime, Dutch landscapes, and garden beauty. Tulips are a popular choice for Easter decorations, spring greeting cards, classroom art projects, and garden-themed invitations.',
      'Our AI tulip generator creates custom tulip illustrations tailored to your project. Generate a field of red and yellow tulips for a spring poster, a single elegant purple tulip for a sophisticated card, a bunch of mixed tulips for a Mother''s Day gift tag, or cute cartoon tulips for a children''s spring activity. Every tulip clip art downloads with a transparent background, free for personal and commercial use.'
    ],
    ARRAY[
      'Colorful tulip field with red yellow and purple tulips',
      'Single elegant purple tulip with green leaves',
      'Cute cartoon tulips in a flower pot'
    ],
    ARRAY['flower', 'daisy', 'rose', 'lily'],
    25,
    'clipart'
  ),
  (
    'flower-clipart-black-and-white',
    'Flower Clipart Black and White',
    'Flower Clipart Black and White',
    'Flower Clipart Black & White — Free Outlines | clip.art',
    'Browse free flower clipart black and white. Clean outlines for printing, coloring, and documents. Generate custom black and white flower illustrations with AI.',
    'Clean, printable flower outlines perfect for coloring pages, documents, invitations, and craft projects — browse our black and white flower clip art or generate your own with AI.',
    ARRAY[
      'Black and white flower clip art serves a different purpose than color imagery — it''s the go-to format when you need clean, printable outlines. Teachers use black and white flower clipart for coloring activities, worksheets, and classroom decorations. Crafters use it for card-making, rubber stamping, and paper crafts. Designers use it for documents, letterheads, and invitations where full color isn''t appropriate or available.',
      'Our AI generator creates custom black and white flower illustrations with crisp, bold outlines in any style. Want a simple five-petal flower outline for a kids'' coloring sheet? A detailed botanical flower drawing for an adult coloring page? An elegant floral border for a wedding program? A minimalist flower icon for a logo? Describe what you need and get a perfectly crafted black and white flower image in seconds, free to download and use.'
    ],
    ARRAY[
      'Simple flower outline with five petals for coloring',
      'Detailed botanical rose drawing in black ink',
      'Elegant floral border with flowers and vines in black and white'
    ],
    ARRAY['flower', 'flower-border', 'rose', 'daisy'],
    26,
    'clipart'
  )
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. Coloring theme (type = 'coloring')
-- ─────────────────────────────────────────────

INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, intro, seo_content, suggested_prompts, related_slugs, sort_order, type)
VALUES (
  'flowers',
  'Flowers',
  'Flower Coloring Pages',
  'Free Flower Coloring Pages — Printable AI Designs | clip.art',
  'Create and download free flower coloring pages. Roses, sunflowers, hibiscus, mandalas and more. Generate custom flower outlines with AI — print instantly.',
  'Explore beautiful flower coloring pages or create your own with AI. From simple daisies for kids to intricate floral mandalas for adults, our generator creates printable flower outlines in seconds.',
  ARRAY[
    'Flower coloring pages are among the most popular printable activities for both children and adults. For kids, coloring flowers builds creativity, fine motor skills, and color recognition — teachers use flower coloring sheets year-round for seasonal classroom activities, nature studies, and spring and summer themes. For adults, detailed floral coloring pages offer a meditative, stress-relieving activity that has become a major trend in the adult coloring book market.',
    'The variety within flower coloring pages is enormous. Simple five-petal flower outlines are perfect for toddlers and preschoolers just learning to color within lines. Cute cartoon flowers with smiling faces delight elementary schoolers. Realistic botanical illustrations challenge older children and adults with fine detail. Intricate floral mandalas provide the deep focus that adult colorists seek. And themed flower pages — spring gardens, tropical bouquets, wildflower meadows — capture specific seasons and moods.',
    'Our AI flower coloring page generator creates custom printable designs for any level and occasion. Describe the type of flower, the style, and the complexity you want, and get a high-quality printable coloring page in seconds. Every design is generated with bold, clean outlines and generous coloring areas, formatted for standard letter or A4 paper. All flower coloring pages are free to download and print.'
  ],
  ARRAY[
    'Beautiful bouquet of roses and peonies with detailed petals',
    'Simple sunflower outline for kids with large petals',
    'Intricate floral mandala with roses, leaves and swirls for adults'
  ],
  ARRAY['spring', 'mandala', 'easter', 'animals'],
  3,
  'coloring'
)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. Update /flower to cross-link new species pages
-- ─────────────────────────────────────────────

UPDATE public.categories
SET related_slugs = ARRAY['hibiscus', 'lotus', 'lily', 'daisy', 'rose', 'tulip', 'flower-clipart-black-and-white', 'christmas', 'heart']
WHERE slug = 'flower'
  AND type = 'clipart';
