-- Phase 2: Coloring Pages SEO
-- Add type column to categories and seed coloring themes

-- 1. Add type column to distinguish clip art categories from coloring themes
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'clipart';

CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories (type);

-- 2. Seed coloring themes (sorted by search volume, highest first)
INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, intro, seo_content, suggested_prompts, related_slugs, sort_order, type)
VALUES
  (
    'mandala',
    'Mandala',
    'Mandala Coloring Pages',
    'Free Mandala Coloring Pages — Printable AI Mandala Designs | clip.art',
    'Create and download free mandala coloring pages. Generate custom geometric mandala designs with AI — perfect for relaxation, mindfulness, and stress relief.',
    'Explore beautiful mandala coloring pages or create your own custom designs with AI. Our mandala generator creates intricate geometric patterns with bold, printable outlines — perfect for adult coloring and mindfulness practice.',
    ARRAY[
      'Mandala coloring pages have become one of the most popular forms of adult coloring, cherished for their meditative qualities and intricate beauty. The word "mandala" comes from Sanskrit meaning "circle," and these geometric patterns have been used for centuries in Hindu and Buddhist traditions as tools for meditation and spiritual growth. Today, coloring mandalas is widely recognized as a therapeutic activity that reduces stress and promotes focus.',
      'Our AI mandala generator creates unique, printable designs with clean bold outlines and large areas perfect for coloring with markers, colored pencils, or crayons. Each mandala is generated as a high-quality portrait page ready to print on standard letter or A4 paper. Whether you prefer simple patterns or complex geometric designs, describe what you want and get a custom mandala in seconds.'
    ],
    ARRAY['intricate floral mandala with lotus petals', 'simple geometric mandala for beginners', 'celestial mandala with stars and moons'],
    ARRAY['unicorn', 'animals', 'mermaid'],
    1,
    'coloring'
  ),
  (
    'unicorn',
    'Unicorn',
    'Unicorn Coloring Pages',
    'Free Unicorn Coloring Pages — Printable AI Unicorn Designs | clip.art',
    'Create and download free unicorn coloring pages. Generate custom unicorn illustrations with AI — perfect for kids, classrooms, and birthday parties.',
    'Discover magical unicorn coloring pages or create your own with AI. Our generator creates beautiful unicorn designs with bold, printable outlines that kids and adults love.',
    ARRAY[
      'Unicorn coloring pages are a favorite among children and adults alike, combining fantasy and creativity in a single activity. These magical creatures inspire imagination and make perfect coloring subjects with their flowing manes, spiraling horns, and enchanted settings. Teachers love using unicorn coloring pages for classroom activities, while parents find them perfect for birthday parties and quiet time.',
      'Our AI unicorn generator creates unique, high-quality coloring pages featuring unicorns in all kinds of magical settings — from rainbow gardens to starlit skies. Each page features bold, clean outlines designed for easy coloring with crayons, markers, or colored pencils. Simply describe the unicorn scene you want and download a printable page in seconds.'
    ],
    ARRAY['unicorn flying over a rainbow castle', 'baby unicorn sleeping on a cloud', 'unicorn in an enchanted forest with butterflies'],
    ARRAY['princess', 'mermaid', 'animals'],
    2,
    'coloring'
  ),
  (
    'dinosaur',
    'Dinosaur',
    'Dinosaur Coloring Pages',
    'Free Dinosaur Coloring Pages — Printable AI Dinosaur Designs | clip.art',
    'Create and download free dinosaur coloring pages. Generate custom dinosaur illustrations with AI — perfect for kids, classrooms, and dino enthusiasts.',
    'Explore awesome dinosaur coloring pages or create your own with AI. Our generator creates detailed dinosaur designs with bold, printable outlines that bring prehistoric creatures to life.',
    ARRAY[
      'Dinosaur coloring pages are a timeless favorite for children of all ages. From the towering T-Rex to the gentle Brontosaurus, these prehistoric creatures spark curiosity about the natural world and make coloring sessions both fun and educational. Teachers frequently use dinosaur coloring pages to complement science lessons about fossils, extinction, and the Mesozoic era.',
      'Our AI dinosaur generator creates unique coloring pages featuring all kinds of dinosaurs in exciting scenes — volcanic landscapes, lush jungles, and prehistoric oceans. Each page is designed with bold, clean outlines and large coloring areas perfect for young hands. Describe the dinosaur scene you want and get a custom, printable coloring page in seconds.'
    ],
    ARRAY['T-Rex roaring in a volcanic landscape', 'friendly triceratops eating plants', 'pterodactyl flying over a prehistoric ocean'],
    ARRAY['animals', 'ocean', 'space'],
    3,
    'coloring'
  ),
  (
    'animals',
    'Animals',
    'Animal Coloring Pages',
    'Free Animal Coloring Pages — Printable AI Animal Designs | clip.art',
    'Create and download free animal coloring pages. Generate custom animal illustrations with AI — perfect for kids, classrooms, and animal lovers.',
    'Find adorable animal coloring pages or create your own with AI. Our generator creates charming animal designs with bold outlines perfect for coloring and printing.',
    ARRAY[
      'Animal coloring pages are among the most versatile and beloved coloring activities for children and adults. From cute puppies and kittens to wild safari animals and exotic marine life, the animal kingdom offers endless creative possibilities. These pages help children learn about different species while developing fine motor skills and color recognition.',
      'Our AI animal generator creates unique coloring pages featuring any animal you can imagine. Whether you want a realistic lion portrait, a cartoon puppy playing in a park, or a detailed butterfly with intricate wing patterns, just describe it and get a printable coloring page instantly. Each design features bold outlines and generous coloring areas suited for all skill levels.'
    ],
    ARRAY['cute puppy playing with a ball in a garden', 'lion family on the African savanna', 'colorful tropical birds in a rainforest'],
    ARRAY['dinosaur', 'ocean', 'farm'],
    4,
    'coloring'
  ),
  (
    'christmas-coloring',
    'Christmas',
    'Christmas Coloring Pages',
    'Free Christmas Coloring Pages — Printable AI Holiday Designs | clip.art',
    'Create and download free Christmas coloring pages. Generate custom holiday illustrations with AI — perfect for classrooms, holiday parties, and family activities.',
    'Get into the holiday spirit with Christmas coloring pages you can create with AI. Our generator makes beautiful holiday designs with bold, printable outlines perfect for festive fun.',
    ARRAY[
      'Christmas coloring pages are a beloved holiday tradition that brings families together during the festive season. From Santa Claus and his reindeer to decorated trees, snowmen, and nativity scenes, Christmas-themed coloring pages capture the magic of the holidays. Teachers and parents use them for classroom parties, advent activities, and quiet time during the busy holiday season.',
      'Our AI Christmas coloring page generator lets you create custom holiday scenes in seconds. Want a gingerbread house covered in candy? A cozy fireplace with stockings? Santa delivering presents? Just describe it and download a printable coloring page instantly. Each design features bold, clean outlines perfect for coloring with crayons, markers, or colored pencils.'
    ],
    ARRAY['Santa Claus riding his sleigh with reindeer', 'decorated Christmas tree with presents underneath', 'gingerbread house covered in candy and icing'],
    ARRAY['easter', 'spring', 'princess'],
    5,
    'coloring'
  ),
  (
    'princess',
    'Princess',
    'Princess Coloring Pages',
    'Free Princess Coloring Pages — Printable AI Princess Designs | clip.art',
    'Create and download free princess coloring pages. Generate custom princess illustrations with AI — perfect for kids, classrooms, and fairy tale fans.',
    'Discover enchanting princess coloring pages or design your own with AI. Our generator creates beautiful princess illustrations with bold outlines ready to print and color.',
    ARRAY[
      'Princess coloring pages transport children into magical worlds of castles, ball gowns, and fairy tale adventures. These pages are incredibly popular with young artists who love bringing royal characters to life with their own color choices. From elegant queens in grand ballrooms to brave princesses on daring adventures, the possibilities are endless.',
      'Our AI princess coloring page generator creates unique royal designs you won''t find anywhere else. Describe any princess scene — a princess riding a dragon, hosting a garden tea party, or exploring an enchanted forest — and get a custom printable page in seconds. Each illustration features bold outlines and generous coloring areas designed for young hands.'
    ],
    ARRAY['princess in a beautiful ballgown at a castle', 'brave princess riding a friendly dragon', 'princess garden tea party with woodland animals'],
    ARRAY['unicorn', 'mermaid', 'christmas-coloring'],
    6,
    'coloring'
  ),
  (
    'easter',
    'Easter',
    'Easter Coloring Pages',
    'Free Easter Coloring Pages — Printable AI Easter Designs | clip.art',
    'Create and download free Easter coloring pages. Generate custom Easter illustrations with AI — perfect for classrooms, Sunday school, and spring celebrations.',
    'Celebrate spring with Easter coloring pages you can create with AI. Our generator makes charming Easter designs with bold, printable outlines for holiday fun.',
    ARRAY[
      'Easter coloring pages capture the joy of spring with decorated eggs, fluffy bunnies, baby chicks, and blooming flowers. These seasonal favorites are perfect for classroom activities, Sunday school lessons, and family holiday celebrations. Children love coloring intricate Easter egg patterns and adorable spring animals.',
      'Our AI Easter coloring page generator lets you create custom holiday scenes instantly. Want a bunny hiding eggs in a garden? A basket overflowing with decorated eggs? A spring meadow with baby chicks and flowers? Describe your perfect Easter scene and download a printable coloring page in seconds. Bold, clean outlines make every page easy and fun to color.'
    ],
    ARRAY['Easter bunny hiding decorated eggs in a garden', 'basket full of colorful Easter eggs with flowers', 'baby chicks hatching from Easter eggs in a spring meadow'],
    ARRAY['spring', 'animals', 'farm'],
    7,
    'coloring'
  ),
  (
    'spring',
    'Spring',
    'Spring Coloring Pages',
    'Free Spring Coloring Pages — Printable AI Spring Designs | clip.art',
    'Create and download free spring coloring pages. Generate custom spring illustrations with AI — featuring flowers, butterflies, gardens, and seasonal scenes.',
    'Welcome spring with beautiful coloring pages you can create with AI. Our generator makes charming springtime designs with bold, printable outlines perfect for the season.',
    ARRAY[
      'Spring coloring pages celebrate the season of renewal with blooming flowers, butterflies, rainbows, birds, and lush gardens. These cheerful designs are perfect for classroom activities during March, April, and May, and make wonderful decorations for bulletin boards and hallway displays. Children love coloring the vibrant scenes that capture the energy of spring.',
      'Our AI spring coloring page generator creates unique seasonal scenes in seconds. From a garden bursting with tulips and daffodils to butterflies dancing in a meadow or a family of birds in a nest, you can design any spring scene you imagine. Each coloring page features bold outlines and large areas perfect for coloring with any medium.'
    ],
    ARRAY['garden full of tulips and daffodils with butterflies', 'rainbow over a meadow with wildflowers', 'birds building a nest in a blooming cherry tree'],
    ARRAY['easter', 'animals', 'ocean'],
    8,
    'coloring'
  ),
  (
    'mermaid',
    'Mermaid',
    'Mermaid Coloring Pages',
    'Free Mermaid Coloring Pages — Printable AI Mermaid Designs | clip.art',
    'Create and download free mermaid coloring pages. Generate custom underwater mermaid illustrations with AI — perfect for kids, ocean lovers, and fantasy fans.',
    'Dive into enchanting mermaid coloring pages or create your own with AI. Our generator creates magical underwater designs with bold outlines perfect for coloring and printing.',
    ARRAY[
      'Mermaid coloring pages combine the magic of fantasy with the beauty of the ocean, making them a perennial favorite for children and adults who love aquatic adventures. From graceful mermaids swimming through coral reefs to undersea kingdoms and treasure-filled caves, these designs spark imagination and creativity.',
      'Our AI mermaid generator creates unique underwater coloring pages you won''t find anywhere else. Describe any mermaid scene — a mermaid playing with dolphins, exploring a sunken ship, or sitting on a rock combing her hair — and get a printable page in seconds. Each design features bold, clean outlines with detailed underwater elements perfect for creative coloring.'
    ],
    ARRAY['mermaid swimming with dolphins in a coral reef', 'mermaid sitting on a rock watching a sunset', 'underwater mermaid kingdom with a castle and sea creatures'],
    ARRAY['ocean', 'unicorn', 'princess'],
    9,
    'coloring'
  ),
  (
    'ocean',
    'Ocean',
    'Ocean Coloring Pages',
    'Free Ocean Coloring Pages — Printable AI Ocean Designs | clip.art',
    'Create and download free ocean coloring pages. Generate custom underwater illustrations with AI — featuring sea life, coral reefs, and marine adventures.',
    'Explore the deep blue with ocean coloring pages you can create with AI. Our generator makes detailed marine designs with bold, printable outlines perfect for ocean lovers.',
    ARRAY[
      'Ocean coloring pages bring the wonders of the sea to life, featuring everything from playful dolphins and majestic whales to vibrant coral reefs and mysterious deep-sea creatures. These educational coloring pages help children learn about marine biology while developing creativity and fine motor skills. Teachers love using ocean themes for science units about ecosystems and conservation.',
      'Our AI ocean coloring page generator creates unique underwater scenes in seconds. Whether you want a peaceful tropical reef, an exciting shark encounter, or a submarine exploring the deep sea, just describe it and get a printable coloring page instantly. Each design features bold outlines and generous coloring areas suitable for all ages and skill levels.'
    ],
    ARRAY['coral reef with tropical fish and sea turtles', 'whale and dolphins playing in ocean waves', 'submarine exploring the deep sea with giant squid'],
    ARRAY['mermaid', 'animals', 'dinosaur'],
    10,
    'coloring'
  ),
  (
    'space',
    'Space',
    'Space Coloring Pages',
    'Free Space Coloring Pages — Printable AI Space Designs | clip.art',
    'Create and download free space coloring pages. Generate custom outer space illustrations with AI — featuring rockets, planets, astronauts, and galaxies.',
    'Blast off with space coloring pages you can create with AI. Our generator makes cosmic designs with bold, printable outlines that are out of this world.',
    ARRAY[
      'Space coloring pages ignite children''s curiosity about the universe with rockets, planets, astronauts, stars, and alien worlds. These cosmic designs are perfect for STEM-focused classroom activities and inspire wonder about space exploration. From realistic depictions of the solar system to imaginative alien landscapes, space coloring pages combine education with creativity.',
      'Our AI space coloring page generator lets you create any cosmic scene you can imagine. Want an astronaut walking on Mars? A space station orbiting Earth? A friendly alien in a UFO? Describe your space adventure and download a printable coloring page in seconds. Bold, clean outlines make each design easy to color while capturing the grandeur of outer space.'
    ],
    ARRAY['astronaut walking on the moon with Earth in the background', 'rocket ship flying past planets in the solar system', 'friendly aliens having a picnic on a colorful planet'],
    ARRAY['dinosaur', 'ocean', 'animals'],
    11,
    'coloring'
  ),
  (
    'farm',
    'Farm',
    'Farm Coloring Pages',
    'Free Farm Coloring Pages — Printable AI Farm Designs | clip.art',
    'Create and download free farm coloring pages. Generate custom farmyard illustrations with AI — featuring barns, tractors, farm animals, and country scenes.',
    'Visit the farm with coloring pages you can create with AI. Our generator makes charming farmyard designs with bold, printable outlines perfect for young artists.',
    ARRAY[
      'Farm coloring pages bring the countryside to life with barns, tractors, farm animals, gardens, and harvest scenes. These wholesome designs are favorites in preschool and elementary classrooms, helping children learn about agriculture, animal care, and where food comes from. From friendly cows and chickens to rolling fields and red barns, farm themes offer rich creative opportunities.',
      'Our AI farm coloring page generator creates unique country scenes in seconds. Whether you want a busy barnyard with all the animals, a tractor harvesting wheat fields, or a farmer''s market overflowing with fresh produce, just describe it and get a printable coloring page instantly. Each design features bold outlines and large areas perfect for young hands learning to color.'
    ],
    ARRAY['red barn with farm animals in the yard', 'tractor driving through golden wheat fields', 'farmer''s market with fruits, vegetables, and flowers'],
    ARRAY['animals', 'spring', 'easter'],
    12,
    'coloring'
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Add a catch-all theme for unclassifiable coloring pages
INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, intro, seo_content, suggested_prompts, related_slugs, sort_order, type)
VALUES (
  'coloring-free',
  'Free Coloring Pages',
  'Free Coloring Pages',
  'Free Coloring Pages — AI Generated Printable Coloring Sheets | clip.art',
  'Browse and create free coloring pages with AI. Generate custom printable coloring sheets for any theme — download instantly.',
  'Explore our collection of free AI-generated coloring pages or create your own. Just describe what you want and get a printable coloring page in seconds.',
  ARRAY[
    'Our free coloring page collection features AI-generated designs across every theme imaginable. Each page is created with bold, clean outlines and large coloring areas, making them perfect for kids, adults, classrooms, and relaxation. All coloring pages are free to download and print for personal or commercial use.',
    'Can''t find what you''re looking for? Create a custom coloring page with our AI generator. Simply describe any scene, character, or pattern and get a unique, printable coloring page in seconds. From simple designs for toddlers to intricate patterns for adults, our generator adapts to any request.'
  ],
  ARRAY['cute animals playing in a garden', 'beautiful flower bouquet with butterflies', 'fantasy castle with a dragon on a mountain'],
  ARRAY['mandala', 'unicorn', 'dinosaur', 'animals'],
  0,
  'coloring'
)
ON CONFLICT (slug) DO NOTHING;
