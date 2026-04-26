-- =============================================================================
-- Worksheets content type
-- =============================================================================
-- Adds:
--   1. generations: grade / subject / topic columns (nullable; only populated
--      for content_type='worksheet' rows)
--   2. Composite indexes for the worksheet browse surfaces (grade hub,
--      subject hub, topic hub)
--   3. categories seeds: grade hubs (7) + subject hubs (42) + topic hubs (~40)
--      all with type='worksheet'
--
-- Slug convention for worksheet category rows uses '--' (double hyphen) as a
-- level separator so we can keep the single-column slug primary key and still
-- disambiguate e.g. '1st-grade--math' from any future standalone 'math' row.
-- =============================================================================

-- 1. generations columns + indexes -------------------------------------------

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS topic text;

-- Composite index for topic-hub queries (the most common worksheet query shape)
CREATE INDEX IF NOT EXISTS idx_generations_worksheet_topic_public
  ON public.generations (grade, subject, topic, is_public)
  WHERE content_type = 'worksheet' AND is_public = true;

-- Grade-hub queries (mixed gallery across all subjects at a grade)
CREATE INDEX IF NOT EXISTS idx_generations_worksheet_grade_public
  ON public.generations (grade, is_public, created_at DESC)
  WHERE content_type = 'worksheet' AND is_public = true;

-- Subject-hub queries
CREATE INDEX IF NOT EXISTS idx_generations_worksheet_grade_subject_public
  ON public.generations (grade, subject, is_public, created_at DESC)
  WHERE content_type = 'worksheet' AND is_public = true;

-- =============================================================================
-- 2. Grade hubs (7 rows) -----------------------------------------------------
-- =============================================================================

INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, intro, type, is_active, sort_order)
VALUES
  (
    'prek',
    'PreK',
    'Free PreK Worksheets',
    'Free PreK Worksheets — Printable Preschool Practice | clip.art',
    'Free printable preschool (PreK) worksheets for letter recognition, counting, tracing, and early phonics. Cute cartoon illustrations, kid-safe, ready to print.',
    'Printable PreK worksheets across phonics, early math, writing, and reading readiness. Every page is built for 3- to 5-year-olds with big fun illustrations and plenty of writing space.',
    'worksheet',
    true,
    1
  ),
  (
    'kindergarten',
    'Kindergarten',
    'Free Kindergarten Worksheets',
    'Free Kindergarten Worksheets — Printable Practice Pages | clip.art',
    'Free printable kindergarten worksheets for phonics, counting, reading, writing, and beginning math. Cute cartoon illustrations, kid-safe, ready to print.',
    'Kindergarten worksheets covering the full K-readiness range — sight words, counting to 20, sound-to-letter, and first reading comprehension. Themed for maximum engagement.',
    'worksheet',
    true,
    2
  ),
  (
    '1st-grade',
    '1st Grade',
    'Free 1st Grade Worksheets',
    'Free 1st Grade Worksheets — Printable Practice Pages | clip.art',
    'Free printable 1st grade worksheets for math, reading, writing, spelling, phonics, and science. Cute cartoon illustrations across every theme kids love.',
    'Printable 1st grade worksheets aligned to core skills — addition and subtraction within 20, phonics, sight words, and short reading passages. Each page comes in a fun visual theme.',
    'worksheet',
    true,
    3
  ),
  (
    '2nd-grade',
    '2nd Grade',
    'Free 2nd Grade Worksheets',
    'Free 2nd Grade Worksheets — Printable Practice Pages | clip.art',
    'Free printable 2nd grade worksheets for math, reading comprehension, writing, science, and spelling. Cute cartoon themes kids actually want to finish.',
    'Printable 2nd grade worksheets covering two-digit math, reading comprehension, complete sentences, and measurement. Themed for kid engagement across dozens of visual worlds.',
    'worksheet',
    true,
    4
  ),
  (
    '3rd-grade',
    '3rd Grade',
    'Free 3rd Grade Worksheets',
    'Free 3rd Grade Worksheets — Printable Practice Pages | clip.art',
    'Free printable 3rd grade worksheets for multiplication, fractions, reading comprehension, cursive, and science. Cute cartoon themes across every topic.',
    'Printable 3rd grade worksheets covering multiplication facts, introductory fractions, reading comprehension passages, and cursive. Built for third graders who want their practice to look fun.',
    'worksheet',
    true,
    5
  ),
  (
    '4th-grade',
    '4th Grade',
    'Free 4th Grade Worksheets',
    'Free 4th Grade Worksheets — Printable Practice Pages | clip.art',
    'Free printable 4th grade worksheets for multi-digit multiplication, long division, reading, writing, and science. Cute cartoon themes across every skill.',
    'Printable 4th grade worksheets covering multi-digit multiplication, long division, reading comprehension, writing prompts, and fractions. Themed to keep fourth graders engaged.',
    'worksheet',
    true,
    6
  ),
  (
    '5th-grade',
    '5th Grade',
    'Free 5th Grade Worksheets',
    'Free 5th Grade Worksheets — Printable Practice Pages | clip.art',
    'Free printable 5th grade worksheets for multi-digit arithmetic, fractions, decimals, reading, and writing. Cute cartoon themes across every topic.',
    'Printable 5th grade worksheets covering multi-digit arithmetic, fractions and decimals, reading comprehension, and longer writing prompts. Visual themes keep practice from feeling like a grind.',
    'worksheet',
    true,
    7
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 3. Subject hubs (grade × subject pairs, slug = "{grade}--{subject}") -------
-- =============================================================================

-- A helper macro to generate subject-hub inserts. We use explicit rows rather
-- than a function so the SQL is readable and reviewable in diffs.

INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, type, is_active, sort_order)
VALUES
  -- PreK
  ('prek--math', 'PreK Math', 'Free PreK Math Worksheets', 'Free PreK Math Worksheets — Counting & Number Sense | clip.art', 'Free printable PreK math worksheets for counting, numbers, and early shapes. Cute cartoon themes kids love.', 'worksheet', true, 10),
  ('prek--reading', 'PreK Reading', 'Free PreK Reading Worksheets', 'Free PreK Reading Worksheets — Pre-Reading Skills | clip.art', 'Free printable PreK reading readiness worksheets. Picture matching, rhyming, and early comprehension.', 'worksheet', true, 11),
  ('prek--writing', 'PreK Writing', 'Free PreK Writing Worksheets', 'Free PreK Writing Worksheets — Line & Shape Tracing | clip.art', 'Free printable PreK writing worksheets. Line tracing, shape tracing, and first letters.', 'worksheet', true, 12),
  ('prek--phonics', 'PreK Phonics', 'Free PreK Phonics Worksheets', 'Free PreK Phonics Worksheets — Letter Sounds | clip.art', 'Free printable PreK phonics worksheets. Letter recognition and beginning sounds.', 'worksheet', true, 13),
  ('prek--science', 'PreK Science', 'Free PreK Science Worksheets', 'Free PreK Science Worksheets — Nature & Weather | clip.art', 'Free printable PreK science worksheets covering weather, animals, plants, and senses.', 'worksheet', true, 14),
  ('prek--spelling', 'PreK Spelling', 'Free PreK Spelling Worksheets', 'Free PreK Spelling Worksheets — First Words | clip.art', 'Free printable PreK spelling worksheets. Color words, number words, and first sight words.', 'worksheet', true, 15),

  -- Kindergarten
  ('kindergarten--math', 'Kindergarten Math', 'Free Kindergarten Math Worksheets', 'Free Kindergarten Math Worksheets — Counting & Addition | clip.art', 'Free printable kindergarten math worksheets. Counting to 20, addition within 10, shapes, and number sense.', 'worksheet', true, 20),
  ('kindergarten--reading', 'Kindergarten Reading', 'Free Kindergarten Reading Worksheets', 'Free Kindergarten Reading Worksheets — Sight Words & Comprehension | clip.art', 'Free printable kindergarten reading worksheets. Sight words, CVC words, and short passages.', 'worksheet', true, 21),
  ('kindergarten--writing', 'Kindergarten Writing', 'Free Kindergarten Writing Worksheets', 'Free Kindergarten Writing Worksheets — Letter & Word Practice | clip.art', 'Free printable kindergarten writing worksheets. Letter formation, name writing, and first sentences.', 'worksheet', true, 22),
  ('kindergarten--phonics', 'Kindergarten Phonics', 'Free Kindergarten Phonics Worksheets', 'Free Kindergarten Phonics Worksheets — Letter Sounds & Blends | clip.art', 'Free printable kindergarten phonics worksheets. Letter sounds, CVC words, and beginning blends.', 'worksheet', true, 23),
  ('kindergarten--science', 'Kindergarten Science', 'Free Kindergarten Science Worksheets', 'Free Kindergarten Science Worksheets — Life & Earth Science | clip.art', 'Free printable kindergarten science worksheets covering plants, animals, weather, and seasons.', 'worksheet', true, 24),
  ('kindergarten--spelling', 'Kindergarten Spelling', 'Free Kindergarten Spelling Worksheets', 'Free Kindergarten Spelling Worksheets — Sight Words & CVC | clip.art', 'Free printable kindergarten spelling worksheets. Sight words and CVC word practice.', 'worksheet', true, 25),

  -- 1st Grade
  ('1st-grade--math', '1st Grade Math', 'Free 1st Grade Math Worksheets', 'Free 1st Grade Math Worksheets — Addition, Subtraction, Place Value | clip.art', 'Free printable 1st grade math worksheets. Addition and subtraction within 20, place value, time, and money.', 'worksheet', true, 30),
  ('1st-grade--reading', '1st Grade Reading', 'Free 1st Grade Reading Worksheets', 'Free 1st Grade Reading Worksheets — Comprehension & Sight Words | clip.art', 'Free printable 1st grade reading worksheets. Short passages with comprehension questions, sight words, and phonics practice.', 'worksheet', true, 31),
  ('1st-grade--writing', '1st Grade Writing', 'Free 1st Grade Writing Worksheets', 'Free 1st Grade Writing Worksheets — Sentences & Prompts | clip.art', 'Free printable 1st grade writing worksheets. Complete sentences, story prompts, and word building.', 'worksheet', true, 32),
  ('1st-grade--phonics', '1st Grade Phonics', 'Free 1st Grade Phonics Worksheets', 'Free 1st Grade Phonics Worksheets — Blends & Digraphs | clip.art', 'Free printable 1st grade phonics worksheets. Consonant blends, digraphs, and long vowel patterns.', 'worksheet', true, 33),
  ('1st-grade--science', '1st Grade Science', 'Free 1st Grade Science Worksheets', 'Free 1st Grade Science Worksheets — Life, Earth, Physical | clip.art', 'Free printable 1st grade science worksheets covering animals, weather, plants, and matter.', 'worksheet', true, 34),
  ('1st-grade--spelling', '1st Grade Spelling', 'Free 1st Grade Spelling Worksheets', 'Free 1st Grade Spelling Worksheets — Word Families & Sight Words | clip.art', 'Free printable 1st grade spelling worksheets. Word families, sight words, and CVCe patterns.', 'worksheet', true, 35),

  -- 2nd Grade
  ('2nd-grade--math', '2nd Grade Math', 'Free 2nd Grade Math Worksheets', 'Free 2nd Grade Math Worksheets — Addition, Subtraction, Money | clip.art', 'Free printable 2nd grade math worksheets. Two-digit addition and subtraction, money, time, and measurement.', 'worksheet', true, 40),
  ('2nd-grade--reading', '2nd Grade Reading', 'Free 2nd Grade Reading Worksheets', 'Free 2nd Grade Reading Worksheets — Comprehension & Fluency | clip.art', 'Free printable 2nd grade reading worksheets. Short stories with comprehension questions, main idea, and context clues.', 'worksheet', true, 41),
  ('2nd-grade--writing', '2nd Grade Writing', 'Free 2nd Grade Writing Worksheets', 'Free 2nd Grade Writing Worksheets — Paragraphs & Story Prompts | clip.art', 'Free printable 2nd grade writing worksheets. Complete paragraphs, narrative prompts, and descriptive writing.', 'worksheet', true, 42),
  ('2nd-grade--phonics', '2nd Grade Phonics', 'Free 2nd Grade Phonics Worksheets', 'Free 2nd Grade Phonics Worksheets — Long Vowels & Diphthongs | clip.art', 'Free printable 2nd grade phonics worksheets. Long vowel patterns, diphthongs, and r-controlled vowels.', 'worksheet', true, 43),
  ('2nd-grade--science', '2nd Grade Science', 'Free 2nd Grade Science Worksheets', 'Free 2nd Grade Science Worksheets — Life Cycles & Earth | clip.art', 'Free printable 2nd grade science worksheets covering life cycles, habitats, weather patterns, and matter.', 'worksheet', true, 44),
  ('2nd-grade--spelling', '2nd Grade Spelling', 'Free 2nd Grade Spelling Worksheets', 'Free 2nd Grade Spelling Worksheets — Patterns & Word Lists | clip.art', 'Free printable 2nd grade spelling worksheets. Common spelling patterns and weekly word lists.', 'worksheet', true, 45),

  -- 3rd Grade
  ('3rd-grade--math', '3rd Grade Math', 'Free 3rd Grade Math Worksheets', 'Free 3rd Grade Math Worksheets — Multiplication, Division, Fractions | clip.art', 'Free printable 3rd grade math worksheets. Multiplication facts, beginning division, fractions, and area.', 'worksheet', true, 50),
  ('3rd-grade--reading', '3rd Grade Reading', 'Free 3rd Grade Reading Worksheets', 'Free 3rd Grade Reading Worksheets — Comprehension & Main Idea | clip.art', 'Free printable 3rd grade reading comprehension worksheets. Multi-paragraph passages with questions, main idea, and inference practice.', 'worksheet', true, 51),
  ('3rd-grade--writing', '3rd Grade Writing', 'Free 3rd Grade Writing Worksheets', 'Free 3rd Grade Writing Worksheets — Paragraphs & Cursive | clip.art', 'Free printable 3rd grade writing worksheets. Multi-paragraph writing, cursive letter practice, and editing.', 'worksheet', true, 52),
  ('3rd-grade--phonics', '3rd Grade Phonics', 'Free 3rd Grade Phonics Worksheets', 'Free 3rd Grade Phonics Worksheets — Advanced Patterns | clip.art', 'Free printable 3rd grade phonics worksheets. Advanced patterns, syllable division, and word roots.', 'worksheet', true, 53),
  ('3rd-grade--science', '3rd Grade Science', 'Free 3rd Grade Science Worksheets', 'Free 3rd Grade Science Worksheets — Solar System & Ecosystems | clip.art', 'Free printable 3rd grade science worksheets covering solar system, ecosystems, forces, and weather.', 'worksheet', true, 54),
  ('3rd-grade--spelling', '3rd Grade Spelling', 'Free 3rd Grade Spelling Worksheets', 'Free 3rd Grade Spelling Worksheets — Suffixes & Prefixes | clip.art', 'Free printable 3rd grade spelling worksheets. Common suffixes, prefixes, and compound words.', 'worksheet', true, 55),

  -- 4th Grade
  ('4th-grade--math', '4th Grade Math', 'Free 4th Grade Math Worksheets', 'Free 4th Grade Math Worksheets — Long Multiplication & Division | clip.art', 'Free printable 4th grade math worksheets. Multi-digit multiplication, long division, fractions, and decimals.', 'worksheet', true, 60),
  ('4th-grade--reading', '4th Grade Reading', 'Free 4th Grade Reading Worksheets', 'Free 4th Grade Reading Worksheets — Comprehension & Context | clip.art', 'Free printable 4th grade reading worksheets. Longer passages, context clues, theme identification, and summarizing.', 'worksheet', true, 61),
  ('4th-grade--writing', '4th Grade Writing', 'Free 4th Grade Writing Worksheets', 'Free 4th Grade Writing Worksheets — Essay Prompts & Editing | clip.art', 'Free printable 4th grade writing worksheets. Multi-paragraph essay prompts, editing, and proofreading.', 'worksheet', true, 62),
  ('4th-grade--phonics', '4th Grade Phonics', 'Free 4th Grade Phonics Worksheets', 'Free 4th Grade Phonics Worksheets — Word Roots & Etymology | clip.art', 'Free printable 4th grade phonics worksheets. Word roots, Greek and Latin affixes, and etymology.', 'worksheet', true, 63),
  ('4th-grade--science', '4th Grade Science', 'Free 4th Grade Science Worksheets', 'Free 4th Grade Science Worksheets — Energy, Matter, Ecosystems | clip.art', 'Free printable 4th grade science worksheets covering energy, matter, ecosystems, and earth science.', 'worksheet', true, 64),
  ('4th-grade--spelling', '4th Grade Spelling', 'Free 4th Grade Spelling Worksheets', 'Free 4th Grade Spelling Worksheets — Multisyllabic Words | clip.art', 'Free printable 4th grade spelling worksheets. Multisyllabic words, homophones, and tricky patterns.', 'worksheet', true, 65),

  -- 5th Grade
  ('5th-grade--math', '5th Grade Math', 'Free 5th Grade Math Worksheets', 'Free 5th Grade Math Worksheets — Fractions, Decimals, Geometry | clip.art', 'Free printable 5th grade math worksheets. Fraction operations, decimals, volume, and geometry.', 'worksheet', true, 70),
  ('5th-grade--reading', '5th Grade Reading', 'Free 5th Grade Reading Worksheets', 'Free 5th Grade Reading Worksheets — Analysis & Inference | clip.art', 'Free printable 5th grade reading worksheets. Longer passages, analysis, inference, and figurative language.', 'worksheet', true, 71),
  ('5th-grade--writing', '5th Grade Writing', 'Free 5th Grade Writing Worksheets', 'Free 5th Grade Writing Worksheets — Essays & Research | clip.art', 'Free printable 5th grade writing worksheets. Essay prompts, research outlines, and persuasive writing.', 'worksheet', true, 72),
  ('5th-grade--phonics', '5th Grade Phonics', 'Free 5th Grade Phonics Worksheets', 'Free 5th Grade Phonics Worksheets — Vocabulary & Roots | clip.art', 'Free printable 5th grade phonics and vocabulary worksheets. Word roots, affixes, and vocabulary building.', 'worksheet', true, 73),
  ('5th-grade--science', '5th Grade Science', 'Free 5th Grade Science Worksheets', 'Free 5th Grade Science Worksheets — Systems & Cycles | clip.art', 'Free printable 5th grade science worksheets covering earth systems, cycles, matter, and energy.', 'worksheet', true, 74),
  ('5th-grade--spelling', '5th Grade Spelling', 'Free 5th Grade Spelling Worksheets', 'Free 5th Grade Spelling Worksheets — Advanced Patterns | clip.art', 'Free printable 5th grade spelling worksheets. Advanced patterns, homophones, and word study.', 'worksheet', true, 75)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 4. Topic hubs (curated MVP — ~40 highest-volume topics) --------------------
-- =============================================================================

INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, type, is_active, sort_order)
VALUES
  -- 1st grade topics
  ('1st-grade--math--addition', 'Addition', 'Free 1st Grade Addition Worksheets', '1st Grade Addition Worksheets — Free Printable | clip.art', 'Free printable 1st grade addition worksheets. Single-digit sums, missing addends, and fact families in cute cartoon themes.', 'worksheet', true, 300),
  ('1st-grade--math--subtraction', 'Subtraction', 'Free 1st Grade Subtraction Worksheets', '1st Grade Subtraction Worksheets — Free Printable | clip.art', 'Free printable 1st grade subtraction worksheets. Subtraction within 20, number lines, and word problems.', 'worksheet', true, 301),
  ('1st-grade--math--place-value', 'Place Value', 'Free 1st Grade Place Value Worksheets', '1st Grade Place Value Worksheets — Free Printable | clip.art', 'Free printable 1st grade place value worksheets. Tens and ones, expanded form, and comparing numbers.', 'worksheet', true, 302),
  ('1st-grade--math--telling-time', 'Telling Time', 'Free 1st Grade Telling Time Worksheets', '1st Grade Telling Time Worksheets — Free Printable | clip.art', 'Free printable 1st grade telling time worksheets. Hour and half-hour reading on analog and digital clocks.', 'worksheet', true, 303),
  ('1st-grade--reading--sight-words', 'Sight Words', 'Free 1st Grade Sight Words Worksheets', '1st Grade Sight Words Worksheets — Free Printable | clip.art', 'Free printable 1st grade sight words worksheets. Dolch and Fry lists with cute cartoon themes.', 'worksheet', true, 310),
  ('1st-grade--writing--handwriting', 'Handwriting', 'Free 1st Grade Handwriting Worksheets', '1st Grade Handwriting Worksheets — Free Printable | clip.art', 'Free printable 1st grade handwriting worksheets. Letter formation and word tracing.', 'worksheet', true, 320),

  -- 2nd grade topics (highest volume)
  ('2nd-grade--math--addition', 'Addition', 'Free 2nd Grade Addition Worksheets', '2nd Grade Addition Worksheets — Free Printable | clip.art', 'Free printable 2nd grade addition worksheets. Two-digit addition with and without regrouping.', 'worksheet', true, 400),
  ('2nd-grade--math--subtraction', 'Subtraction', 'Free 2nd Grade Subtraction Worksheets', '2nd Grade Subtraction Worksheets — Free Printable | clip.art', 'Free printable 2nd grade subtraction worksheets. Two-digit subtraction with regrouping.', 'worksheet', true, 401),
  ('2nd-grade--math--money', 'Money', 'Free 2nd Grade Money Worksheets', '2nd Grade Money Worksheets — Free Printable | clip.art', 'Free printable 2nd grade money worksheets. Counting coins and making change.', 'worksheet', true, 402),
  ('2nd-grade--math--telling-time', 'Telling Time', 'Free 2nd Grade Telling Time Worksheets', '2nd Grade Telling Time Worksheets — Free Printable | clip.art', 'Free printable 2nd grade telling time worksheets. Reading analog clocks to the nearest five minutes.', 'worksheet', true, 403),
  ('2nd-grade--reading--reading-comprehension', 'Reading Comprehension', 'Free 2nd Grade Reading Comprehension Worksheets', '2nd Grade Reading Comprehension Worksheets — Free | clip.art', 'Free printable 2nd grade reading comprehension worksheets. Short passages with questions, main idea, and inference.', 'worksheet', true, 410),

  -- 3rd grade topics (highest volume)
  ('3rd-grade--math--multiplication', 'Multiplication', 'Free 3rd Grade Multiplication Worksheets', '3rd Grade Multiplication Worksheets — Free Printable | clip.art', 'Free printable 3rd grade multiplication worksheets. Multiplication facts 0–12, arrays, and word problems.', 'worksheet', true, 500),
  ('3rd-grade--math--division', 'Division', 'Free 3rd Grade Division Worksheets', '3rd Grade Division Worksheets — Free Printable | clip.art', 'Free printable 3rd grade division worksheets. Beginning division, fact families, and equal groups.', 'worksheet', true, 501),
  ('3rd-grade--math--fractions', 'Fractions', 'Free 3rd Grade Fractions Worksheets', '3rd Grade Fractions Worksheets — Free Printable | clip.art', 'Free printable 3rd grade fractions worksheets. Introducing fractions, equivalent fractions, and comparing fractions.', 'worksheet', true, 502),
  ('3rd-grade--reading--reading-comprehension', 'Reading Comprehension', 'Free 3rd Grade Reading Comprehension Worksheets', '3rd Grade Reading Comprehension Worksheets — Free | clip.art', 'Free printable 3rd grade reading comprehension worksheets. Multi-paragraph passages with inference and main-idea questions.', 'worksheet', true, 510),
  ('3rd-grade--writing--cursive', 'Cursive', 'Free 3rd Grade Cursive Worksheets', '3rd Grade Cursive Worksheets — Free Printable | clip.art', 'Free printable 3rd grade cursive worksheets. Uppercase and lowercase cursive letter formation and words.', 'worksheet', true, 520),

  -- 4th grade topics
  ('4th-grade--math--multiplication', 'Multiplication', 'Free 4th Grade Multiplication Worksheets', '4th Grade Multiplication Worksheets — Free Printable | clip.art', 'Free printable 4th grade multiplication worksheets. Multi-digit multiplication and word problems.', 'worksheet', true, 600),
  ('4th-grade--math--division', 'Division', 'Free 4th Grade Division Worksheets', '4th Grade Division Worksheets — Free Printable | clip.art', 'Free printable 4th grade division worksheets. Long division and division word problems.', 'worksheet', true, 601),
  ('4th-grade--math--fractions', 'Fractions', 'Free 4th Grade Fractions Worksheets', '4th Grade Fractions Worksheets — Free Printable | clip.art', 'Free printable 4th grade fractions worksheets. Adding, subtracting, and comparing fractions.', 'worksheet', true, 602),
  ('4th-grade--reading--reading-comprehension', 'Reading Comprehension', 'Free 4th Grade Reading Comprehension Worksheets', '4th Grade Reading Comprehension Worksheets — Free | clip.art', 'Free printable 4th grade reading comprehension worksheets. Longer passages with inference and theme questions.', 'worksheet', true, 610),

  -- 5th grade topics
  ('5th-grade--math--multiplication', 'Multiplication', 'Free 5th Grade Multiplication Worksheets', '5th Grade Multiplication Worksheets — Free Printable | clip.art', 'Free printable 5th grade multiplication worksheets. Multi-digit multiplication and decimal multiplication.', 'worksheet', true, 700),
  ('5th-grade--math--fractions', 'Fractions', 'Free 5th Grade Fractions Worksheets', '5th Grade Fractions Worksheets — Free Printable | clip.art', 'Free printable 5th grade fractions worksheets. Fraction operations, mixed numbers, and word problems.', 'worksheet', true, 701),
  ('5th-grade--math--decimals', 'Decimals', 'Free 5th Grade Decimals Worksheets', '5th Grade Decimals Worksheets — Free Printable | clip.art', 'Free printable 5th grade decimals worksheets. Decimal operations and place value.', 'worksheet', true, 702),
  ('5th-grade--reading--reading-comprehension', 'Reading Comprehension', 'Free 5th Grade Reading Comprehension Worksheets', '5th Grade Reading Comprehension Worksheets — Free | clip.art', 'Free printable 5th grade reading comprehension worksheets. Extended passages with analysis and inference questions.', 'worksheet', true, 710),

  -- Kindergarten topics
  ('kindergarten--math--counting', 'Counting', 'Free Kindergarten Counting Worksheets', 'Kindergarten Counting Worksheets — Free Printable | clip.art', 'Free printable kindergarten counting worksheets. Counting to 20, skip counting, and number recognition.', 'worksheet', true, 200),
  ('kindergarten--math--addition', 'Addition', 'Free Kindergarten Addition Worksheets', 'Kindergarten Addition Worksheets — Free Printable | clip.art', 'Free printable kindergarten addition worksheets. Addition within 10 with pictures and number lines.', 'worksheet', true, 201),
  ('kindergarten--phonics--letter-sounds', 'Letter Sounds', 'Free Kindergarten Letter Sounds Worksheets', 'Kindergarten Letter Sounds Worksheets — Free | clip.art', 'Free printable kindergarten letter sounds worksheets. Beginning sounds and letter-to-sound matching.', 'worksheet', true, 210),
  ('kindergarten--reading--sight-words', 'Sight Words', 'Free Kindergarten Sight Words Worksheets', 'Kindergarten Sight Words Worksheets — Free Printable | clip.art', 'Free printable kindergarten sight words worksheets. First 50 sight words with cute cartoon themes.', 'worksheet', true, 220),
  ('kindergarten--writing--letter-tracing', 'Letter Tracing', 'Free Kindergarten Letter Tracing Worksheets', 'Kindergarten Letter Tracing Worksheets — Free | clip.art', 'Free printable kindergarten letter tracing worksheets. Uppercase and lowercase letter formation.', 'worksheet', true, 230),
  ('kindergarten--math--shapes', 'Shapes', 'Free Kindergarten Shapes Worksheets', 'Kindergarten Shapes Worksheets — Free Printable | clip.art', 'Free printable kindergarten shapes worksheets. Identify, trace, and color circles, squares, triangles, and more.', 'worksheet', true, 202),

  -- PreK topics
  ('prek--phonics--letter-recognition', 'Letter Recognition', 'Free PreK Letter Recognition Worksheets', 'PreK Letter Recognition Worksheets — Free Printable | clip.art', 'Free printable PreK letter recognition worksheets. Alphabet identification with cute cartoon themes.', 'worksheet', true, 100),
  ('prek--math--counting', 'Counting', 'Free PreK Counting Worksheets', 'PreK Counting Worksheets — Free Printable | clip.art', 'Free printable PreK counting worksheets. Counting to 10 with pictures.', 'worksheet', true, 101),
  ('prek--writing--line-tracing', 'Line Tracing', 'Free PreK Line Tracing Worksheets', 'PreK Line Tracing Worksheets — Free Printable | clip.art', 'Free printable PreK line tracing worksheets. Pre-writing strokes and shape tracing.', 'worksheet', true, 102),

  -- "Free" catch-all for misclassified worksheets
  ('worksheet-free', 'Other Worksheets', 'Other Worksheets', 'Free Worksheets — Printable Practice Pages | clip.art', 'Free printable worksheets that don''t fit a specific grade or subject hub yet.', 'worksheet', true, 9999)
ON CONFLICT (slug) DO NOTHING;
