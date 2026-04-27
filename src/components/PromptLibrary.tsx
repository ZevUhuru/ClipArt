"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type StyleKey } from "@/lib/styles";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";

type Difficulty = "starter" | "intermediate" | "advanced";

interface PromptEntry {
  prompt: string;
  style: StyleKey;
  category: string;
  difficulty: Difficulty;
}

const PROMPTS: PromptEntry[] = [
  // ── Christmas & Winter Holidays ────────────────────────────────────────────
  { prompt: "Santa Claus with a big red bag, jolly expression, simple flat illustration", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "A decorated Christmas tree with wrapped gifts underneath, warm glowing lights", style: "cartoon", category: "Christmas", difficulty: "starter" },
  { prompt: "Steaming mug of hot cocoa with marshmallows and a candy cane, cozy minimal flat style", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "An ornate Christmas ornament with hand-painted floral details, gold filigree on deep red, vintage German Kugel style", style: "vintage", category: "Christmas", difficulty: "intermediate" },
  { prompt: "A holiday wreath of pine, holly berries, pinecones and velvet ribbon, botanical illustration style, circular composition", style: "watercolor", category: "Christmas", difficulty: "intermediate" },
  { prompt: "Snowman in a top hat and scarf, carrot nose, three coal buttons, friendly cartoon expression", style: "cartoon", category: "Christmas", difficulty: "starter" },
  { prompt: "A reindeer silhouette mid-leap across a full moon, Japanese woodblock print style, limited indigo and cream palette", style: "flat", category: "Christmas", difficulty: "advanced" },
  { prompt: "Snow-covered village rooftops at midnight, single chimney with smoke curling upward, moonlit, quiet architectural line art", style: "outline", category: "Christmas", difficulty: "advanced" },

  // ── Halloween & Fall ────────────────────────────────────────────────────────
  { prompt: "A grinning carved jack-o'-lantern with a candle glowing inside, flat orange and black", style: "flat", category: "Halloween", difficulty: "starter" },
  { prompt: "A black cat silhouetted on a fence post under a crescent moon, bold graphic outlines", style: "flat", category: "Halloween", difficulty: "starter" },
  { prompt: "Tumbling autumn maple leaves in red, orange, and gold, loose watercolor brushwork", style: "watercolor", category: "Halloween", difficulty: "starter" },
  { prompt: "A friendly ghost with wide eyes and a wavy hem, thick outline, pastel lavender tint", style: "sticker", category: "Halloween", difficulty: "starter" },
  { prompt: "A cozy scarecrow in a pumpkin patch, golden harvest light, warm flat palette", style: "flat", category: "Halloween", difficulty: "intermediate" },
  { prompt: "A haunted mansion on a hill with dead oak trees and bats in the sky, detailed pen-and-ink style, dramatic fog, limited palette", style: "outline", category: "Halloween", difficulty: "advanced" },

  // ── Sports ─────────────────────────────────────────────────────────────────
  { prompt: "A volleyball mid-air above the net, clean flat graphic, blue and white", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A basketball with bold graphic stitching lines, dynamic angle, orange and black", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A soccer player kicking a ball, full silhouette, single solid fill", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "Crossed baseball bats with a ball centered above, vintage patch badge composition, circular, distressed texture", style: "vintage", category: "Sports", difficulty: "intermediate" },
  { prompt: "A tennis racket and ball mid-swing, elegant flat design, clean lines, white and forest green", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A baseball pitcher in full wind-up, dynamic action pose, bold comic style, stadium silhouetted behind", style: "cartoon", category: "Sports", difficulty: "intermediate" },
  { prompt: "A basketball player mid-dunk in geometric low-poly facets, dramatic upward perspective, bold team colors", style: "flat", category: "Sports", difficulty: "advanced" },
  { prompt: "A football player breaking through a tackle, dynamic energy lines, retro screen-print feel, 3-color halftone palette", style: "vintage", category: "Sports", difficulty: "advanced" },

  // ── Dogs ───────────────────────────────────────────────────────────────────
  { prompt: "A fluffy golden retriever puppy with floppy ears, warm cartoon style", style: "cartoon", category: "Dogs", difficulty: "starter" },
  { prompt: "A Dalmatian sitting with spots on a white coat, clean flat illustration, black and white with a red collar", style: "flat", category: "Dogs", difficulty: "starter" },
  { prompt: "A German shepherd in alert side-profile stance, bold clean outlines, realistic proportions", style: "outline", category: "Dogs", difficulty: "intermediate" },
  { prompt: "A corgi from behind with a tiny wiggling tail, pastel background, kawaii round shapes", style: "kawaii", category: "Dogs", difficulty: "starter" },
  { prompt: "A greyhound in full stride rendered in geometric facets, elegant elongated proportions, monochrome with a single gold accent", style: "flat", category: "Dogs", difficulty: "advanced" },

  // ── Cats ───────────────────────────────────────────────────────────────────
  { prompt: "A tabby cat curled up asleep on a soft cushion, soft round shapes, cozy warm tones", style: "cartoon", category: "Cats", difficulty: "starter" },
  { prompt: "A black cat with glowing green eyes sitting upright, minimal flat shapes, Halloween-adjacent but not spooky", style: "flat", category: "Cats", difficulty: "starter" },
  { prompt: "A calico cat mid-stretch with a long arching back, flat illustration, delicate linework, muted pastel palette", style: "flat", category: "Cats", difficulty: "intermediate" },
  { prompt: "A cat skull adorned with delicate floral crown, Day of the Dead aesthetic, symmetrical, black and blush pink fills", style: "flat", category: "Cats", difficulty: "advanced" },

  // ── Wildlife & Safari ──────────────────────────────────────────────────────
  { prompt: "A friendly elephant with large ears and raised trunk, simple bold shapes, warm grey", style: "cartoon", category: "Wildlife", difficulty: "starter" },
  { prompt: "A shark viewed from below against shafts of light, dramatic silhouette, deep blue gradient", style: "flat", category: "Wildlife", difficulty: "intermediate" },
  { prompt: "A tiger face viewed straight-on, bold stripes, intense amber eyes, flat fills in orange and black", style: "flat", category: "Wildlife", difficulty: "intermediate" },
  { prompt: "A lion's mane rendered as a sun — the face centered, mane radiating outward like rays, gold badge style", style: "flat", category: "Wildlife", difficulty: "intermediate" },
  { prompt: "A humpback whale breaching at sunset, Japanese sumi-e brush ink style, flowing strokes, coastal palette", style: "watercolor", category: "Wildlife", difficulty: "advanced" },
  { prompt: "A monarch butterfly wings fully spread, botanical scientific illustration style, detailed wing vein patterns, symmetrical", style: "watercolor", category: "Wildlife", difficulty: "advanced" },

  // ── School & Education ─────────────────────────────────────────────────────
  { prompt: "A red apple with a glossy highlight sitting on a stack of books, classic school illustration style", style: "flat", category: "School", difficulty: "starter" },
  { prompt: "A yellow school bus from a front three-quarter view, flat geometric shapes, friendly", style: "flat", category: "School", difficulty: "starter" },
  { prompt: "Pencil and ruler crossed like a crest, clean minimal graphic, school supplies theme", style: "flat", category: "School", difficulty: "starter" },
  { prompt: "A backpack overflowing with school supplies — books, rulers, colored pencils — flat lay composition", style: "flat", category: "School", difficulty: "intermediate" },
  { prompt: "A teacher at a chalkboard with floating math equations around her, warm flat illustration, friendly expression", style: "cartoon", category: "School", difficulty: "intermediate" },
  { prompt: "A microscope with a glowing slide, science lab setting implied, clean vector style, teal and white palette", style: "flat", category: "School", difficulty: "intermediate" },
  { prompt: "A brain divided into subject quadrants — music, math, art, science — each quadrant using its own visual language, symmetrical diagram style", style: "flat", category: "School", difficulty: "advanced" },

  // ── Food & Drinks ──────────────────────────────────────────────────────────
  { prompt: "A birthday cake with lit candles and colorful frosting swirls, cheerful cartoon style", style: "cartoon", category: "Food", difficulty: "starter" },
  { prompt: "A dripping ice cream cone with three scoops in pastel colors, simple clean illustration", style: "flat", category: "Food", difficulty: "starter" },
  { prompt: "A pizza slice with melting cheese pulling away, flat warm illustration, overhead angle", style: "flat", category: "Food", difficulty: "starter" },
  { prompt: "A steaming latte with perfect leaf-shaped foam art, top-down view, minimal flat style", style: "flat", category: "Food", difficulty: "intermediate" },
  { prompt: "A bowl of strawberries, some whole and some cut, botanical illustration style, fine leaf and seed detail", style: "watercolor", category: "Food", difficulty: "intermediate" },
  { prompt: "A candy jar with layered sweets visible through glass, warm old-fashioned shopfront illustration style", style: "vintage", category: "Food", difficulty: "intermediate" },
  { prompt: "A birthday cake deconstructed as an architectural exploded diagram — sponge layers labeled, frosting layers annotated, editorial flat illustration", style: "flat", category: "Food", difficulty: "advanced" },

  // ── Flowers & Botanical ────────────────────────────────────────────────────
  { prompt: "A simple daisy with white petals and a yellow center, clean flat illustration", style: "flat", category: "Flowers", difficulty: "starter" },
  { prompt: "A single red rose with thorned stem, bold graphic style, Valentine's Day classic", style: "flat", category: "Flowers", difficulty: "starter" },
  { prompt: "A sunflower in full bloom, front-on, bold graphic style, warm yellow and deep brown center", style: "flat", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A loose wildflower bouquet — daisies, poppies, lavender — hand-tied with twine, loose watercolor brushwork", style: "watercolor", category: "Flowers", difficulty: "intermediate" },
  { prompt: "An art nouveau rose with flowing stem and leaves forming a decorative frame, organic curves, limited palette", style: "flat", category: "Flowers", difficulty: "advanced" },
  { prompt: "A Victorian botanical illustration plate of a bird-of-paradise flower — labeled parts, fine linework, natural history style", style: "watercolor", category: "Flowers", difficulty: "advanced" },

  // ── Nature & Weather ───────────────────────────────────────────────────────
  { prompt: "A happy smiling sun with short bold rays, flat yellow, simple cartoon face", style: "cartoon", category: "Nature", difficulty: "starter" },
  { prompt: "A fluffy white cloud on a light blue field, minimal flat shape", style: "flat", category: "Nature", difficulty: "starter" },
  { prompt: "A rainbow arching over a grassy hill with a pot of gold at the end, classic storybook style", style: "cartoon", category: "Nature", difficulty: "starter" },
  { prompt: "A speckled mushroom cap in a bed of green moss and tiny ferns, forest floor perspective, loose watercolor washes", style: "watercolor", category: "Nature", difficulty: "intermediate" },
  { prompt: "A palm tree silhouette against a tropical coral and teal sunset, clean flat design", style: "flat", category: "Nature", difficulty: "intermediate" },
  { prompt: "A full oak tree losing its autumn leaves, cross-section showing root system below the soil line, detailed scientific illustration style", style: "outline", category: "Nature", difficulty: "advanced" },

  // ── People & Characters ────────────────────────────────────────────────────
  { prompt: "A smiling nurse in scrubs holding a stethoscope, clean flat illustration, friendly expression", style: "flat", category: "People", difficulty: "starter" },
  { prompt: "A family of four holding hands — two parents and two kids — colorful flat shapes, diverse and warm", style: "flat", category: "People", difficulty: "starter" },
  { prompt: "A young girl reading a large open book while seated cross-legged, warm picture-book illustration style", style: "cartoon", category: "People", difficulty: "intermediate" },
  { prompt: "A graduation student in cap and gown, mortarboard mid-toss in the air, bold celebration energy", style: "flat", category: "People", difficulty: "intermediate" },
  { prompt: "A cowboy in full kit — hat, boots, spurs, lasso coiled at hip — rendered as a vintage American West lithograph, sepia and rust palette", style: "vintage", category: "People", difficulty: "advanced" },
  { prompt: "A group portrait of four friends, each with distinct outfit and personality, bold graphic novel line art, flat color fills", style: "flat", category: "People", difficulty: "advanced" },

  // ── Vehicles & Transport ───────────────────────────────────────────────────
  { prompt: "A red race car viewed from the side, bold flat shapes, speed lines trailing behind", style: "flat", category: "Vehicles", difficulty: "starter" },
  { prompt: "A vintage biplane with a checkered tail and a trailing banner, flat graphic, adventure feel", style: "flat", category: "Vehicles", difficulty: "starter" },
  { prompt: "An old wooden sailboat on calm water at golden hour, delicate watercolor, soft marine palette", style: "watercolor", category: "Vehicles", difficulty: "intermediate" },
  { prompt: "A steam train departing a station, smoke billowing, retro travel poster aesthetic, bold geometric shapes", style: "vintage", category: "Vehicles", difficulty: "intermediate" },
  { prompt: "A rocket ship cross-section showing interior deck levels, retro mid-century NASA poster aesthetic, limited 4-color palette", style: "vintage", category: "Vehicles", difficulty: "advanced" },

  // ── Celebrations & Milestones ──────────────────────────────────────────────
  { prompt: "A graduation cap with tassel mid-toss against a burst of confetti, flat and festive", style: "flat", category: "Celebrations", difficulty: "starter" },
  { prompt: "A birthday cupcake with a single lit candle and a sprinkled frosting swirl, cute simple style", style: "kawaii", category: "Celebrations", difficulty: "starter" },
  { prompt: "A trophy cup with a laurel wreath, bold gold graphic, championship badge composition", style: "flat", category: "Celebrations", difficulty: "intermediate" },
  { prompt: "Party balloons in a cluster of five, each a different color, flat simple shapes with string tails", style: "flat", category: "Celebrations", difficulty: "starter" },
  { prompt: "A fireworks burst over a city skyline at night, Art Deco geometric style, gold and midnight blue palette", style: "flat", category: "Celebrations", difficulty: "advanced" },
  { prompt: "A New Year's countdown clock at midnight, confetti, champagne glasses clinking, warm festive palette, editorial illustration feel", style: "vintage", category: "Celebrations", difficulty: "advanced" },

  // ── Music ──────────────────────────────────────────────────────────────────
  { prompt: "An acoustic guitar with musical notes floating off the strings, flat cartoon style, warm wood tones", style: "cartoon", category: "Music", difficulty: "starter" },
  { prompt: "A vintage microphone on a stand with a starburst backdrop, 1950s retro style, monochrome with gold accent", style: "vintage", category: "Music", difficulty: "intermediate" },
  { prompt: "Headphones with a sound wave visualization flowing out of each ear cup, minimal tech-forward design", style: "flat", category: "Music", difficulty: "intermediate" },
  { prompt: "A jazz trumpet player mid-solo, 1920s Art Deco style, bold geometric abstraction, gold and dark navy", style: "vintage", category: "Music", difficulty: "advanced" },

  // ── Fantasy & Mythology ────────────────────────────────────────────────────
  { prompt: "A friendly cartoon dragon perched on a rock, simple round shapes, bright scales, non-threatening", style: "cartoon", category: "Fantasy", difficulty: "starter" },
  { prompt: "A unicorn with a flowing rainbow mane, flat illustration, pastel palette, sparkles around the horn", style: "flat", category: "Fantasy", difficulty: "starter" },
  { prompt: "A mermaid seated on a coral reef with flowing hair and a fish tail, clean fairy-tale illustration style", style: "flat", category: "Fantasy", difficulty: "intermediate" },
  { prompt: "A phoenix rising from flames, symmetrical heraldic composition, bold flat fills in crimson and gold, suitable for a badge", style: "flat", category: "Fantasy", difficulty: "advanced" },
  { prompt: "Medusa portrait with serpents for hair, Art Nouveau flowing organic lines, oval decorative frame, olive green and gold palette", style: "vintage", category: "Fantasy", difficulty: "advanced" },

  // ── Everyday Objects ───────────────────────────────────────────────────────
  { prompt: "A dollar sign money bag in dark green with bold white type, clean simple graphic", style: "flat", category: "Objects", difficulty: "starter" },
  { prompt: "A classic alarm clock showing 7am, happy cartoon face on the dial, rounded retro style", style: "cartoon", category: "Objects", difficulty: "starter" },
  { prompt: "A vintage camera with a flash attachment, 1970s photography feel, warm halftone print feel, orange and brown", style: "vintage", category: "Objects", difficulty: "intermediate" },
  { prompt: "A stethoscope coiled to form a heart shape, flat line art, healthcare and care theme", style: "outline", category: "Objects", difficulty: "intermediate" },
  { prompt: "A royal crown with detailed jewel settings — rubies, sapphires, emeralds — flat but richly detailed, heraldic composition", style: "flat", category: "Objects", difficulty: "advanced" },

  // ── Travel & Beach ─────────────────────────────────────────────────────────
  { prompt: "A palm tree on a sandy beach with a blue ocean, simple happy flat illustration", style: "flat", category: "Travel", difficulty: "starter" },
  { prompt: "A pair of flip-flops on sand with a sunhat and sunglasses, summer flat lay style", style: "flat", category: "Travel", difficulty: "starter" },
  { prompt: "Vintage luggage tags and travel stamps from imaginary world destinations, editorial collage illustration style", style: "vintage", category: "Travel", difficulty: "intermediate" },
  { prompt: "A world map with illustrated regional icons — Eiffel Tower, pyramids, Statue of Liberty — vintage travel atlas style, aged parchment palette", style: "vintage", category: "Travel", difficulty: "advanced" },

  // ── Science & Space ────────────────────────────────────────────────────────
  { prompt: "Planet Earth from space, bold simple sphere, blue and green continents, clean graphic style", style: "flat", category: "Science", difficulty: "starter" },
  { prompt: "A human brain with glowing neural connection lines, clean medical diagram aesthetic, blue and white palette", style: "flat", category: "Science", difficulty: "intermediate" },
  { prompt: "A chemistry set with beakers and colorful liquids bubbling, flat science illustration, bold outlines", style: "cartoon", category: "Science", difficulty: "intermediate" },
  { prompt: "The solar system as a vintage orrery diagram, concentric orbits labeled, antique illustration style, sepia and gold ink", style: "vintage", category: "Science", difficulty: "advanced" },

  // ── American Patriotic & Cultural ─────────────────────────────────────────
  { prompt: "An American flag waving, bold flat stripes and stars, clean graphic", style: "flat", category: "Patriotic", difficulty: "starter" },
  { prompt: "The Statue of Liberty from the front, torch raised, flat editorial illustration, muted blue-green palette", style: "flat", category: "Patriotic", difficulty: "intermediate" },
  { prompt: "A bald eagle in full wingspan from the front, bold heraldic composition, shield on chest, classic American seal style", style: "flat", category: "Patriotic", difficulty: "advanced" },

  // ── Hearts & Love ──────────────────────────────────────────────────────────
  { prompt: "A bold red heart, perfectly symmetrical, classic and clean, glossy flat style", style: "flat", category: "Hearts", difficulty: "starter" },
  { prompt: "A heart made from a knot of rope, tied at the top, single-color flat illustration, nautical feel", style: "flat", category: "Hearts", difficulty: "starter" },
  { prompt: "Two hearts intertwined forming a figure-eight infinity shape, continuous line drawing, rose gold palette", style: "outline", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A heart filled with tiny flowers — roses, daisies, lilies packed in tight — botanical mosaic style, pink and green", style: "watercolor", category: "Hearts", difficulty: "intermediate" },
  { prompt: "An anatomical human heart, cross-section visible, labeled vessels, vintage medical textbook illustration style, sepia ink", style: "vintage", category: "Hearts", difficulty: "advanced" },
  { prompt: "A heart with a banner ribbon across it — classic American tattoo flash style, bold outlines, limited red and black palette", style: "vintage", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A broken heart cracked down the center, jagged split, dramatic shadows, editorial flat graphic", style: "flat", category: "Hearts", difficulty: "starter" },

  // ── Easter & Spring ────────────────────────────────────────────────────────
  { prompt: "A painted Easter egg with bold geometric diamond patterns, flat illustration, pastel festival palette", style: "flat", category: "Easter", difficulty: "starter" },
  { prompt: "A fluffy yellow chick hatching from a cracked egg, cartoon style, big eyes, surprised expression", style: "cartoon", category: "Easter", difficulty: "starter" },
  { prompt: "An Easter basket brimming with eggs, chocolate bunny, and green grass stuffing, warm flat illustration", style: "flat", category: "Easter", difficulty: "starter" },
  { prompt: "A spring tulip in single full bloom, minimal botanical line art, clean stem and leaves, Dutch flower market feel", style: "outline", category: "Easter", difficulty: "intermediate" },
  { prompt: "A spring flower arrangement in a mason jar — daffodils, hyacinths, tulips — loose wet-on-wet watercolor technique", style: "watercolor", category: "Easter", difficulty: "intermediate" },
  { prompt: "An Easter egg with intricate Ukrainian pysanka-style patterns — geometric bands, fine detail, warm traditional palette", style: "flat", category: "Easter", difficulty: "advanced" },

  // ── Thanksgiving ──────────────────────────────────────────────────────────
  { prompt: "A cartoon turkey with a fan of colorful feathers, round body, friendly face, classic Thanksgiving mascot style", style: "cartoon", category: "Thanksgiving", difficulty: "starter" },
  { prompt: "A cornucopia basket spilling autumn fruits and vegetables, traditional harvest illustration, warm orange and brown", style: "vintage", category: "Thanksgiving", difficulty: "intermediate" },
  { prompt: "A pumpkin pie slice with swirled whipped cream, steam rising, flat cozy illustration, warm dessert tones", style: "flat", category: "Thanksgiving", difficulty: "starter" },
  { prompt: "An ear of corn, golden kernels and green husks peeled back, clean flat agricultural illustration", style: "flat", category: "Thanksgiving", difficulty: "starter" },
  { prompt: "A harvest wreath of wheat stalks, dried leaves, small gourds, and orange berries, circular flat composition", style: "flat", category: "Thanksgiving", difficulty: "intermediate" },

  // ── Summer ────────────────────────────────────────────────────────────────
  { prompt: "A popsicle with two colors melting in the sun, drips running down the stick, bright flat illustration", style: "flat", category: "Summer", difficulty: "starter" },
  { prompt: "Sunglasses with mirrored lenses reflecting a tiny beach scene, flat graphic, cool and minimal", style: "flat", category: "Summer", difficulty: "intermediate" },
  { prompt: "A watermelon slice, bold red flesh with black seeds and striped green rind, clean flat design", style: "flat", category: "Summer", difficulty: "starter" },
  { prompt: "A beach umbrella and two folding chairs on white sand, minimal flat scene, midday light, no shadow", style: "flat", category: "Summer", difficulty: "starter" },
  { prompt: "A surfboard with a tropical hibiscus pattern, bold graphic design, side profile view, ocean palette", style: "flat", category: "Summer", difficulty: "intermediate" },
  { prompt: "A lemonade stand with a handwritten sign and a pitcher of lemonade on ice, warm flat illustration, childhood nostalgia", style: "cartoon", category: "Summer", difficulty: "intermediate" },

  // ── House & Home ──────────────────────────────────────────────────────────
  { prompt: "A cute house with a red door, white walls, and a chimney with smoke, welcoming flat illustration", style: "flat", category: "Home", difficulty: "starter" },
  { prompt: "A cozy armchair beside a floor lamp with a small side table and a cup of tea, interior flat illustration", style: "flat", category: "Home", difficulty: "intermediate" },
  { prompt: "A neatly made bed with a fluffy duvet and stacked pillows, calm bedroom flat illustration, neutral tones", style: "flat", category: "Home", difficulty: "starter" },
  { prompt: "A treehouse in a large oak tree with a rope ladder and a small window with curtains, adventurous cartoon style", style: "cartoon", category: "Home", difficulty: "intermediate" },
  { prompt: "A Victorian dollhouse cutaway showing six furnished rooms across three floors, detailed flat illustration, pastel palette", style: "flat", category: "Home", difficulty: "advanced" },

  // ── Trees & Plants ────────────────────────────────────────────────────────
  { prompt: "An autumn tree shedding orange and red leaves, flat silhouette, warm seasonal palette, no background detail", style: "flat", category: "Trees", difficulty: "starter" },
  { prompt: "A tall pine forest silhouette at dusk, layered tree lines, cool blue-purple gradient sky", style: "flat", category: "Trees", difficulty: "intermediate" },
  { prompt: "A bonsai tree with a gnarled trunk and asymmetric canopy in a shallow ceramic pot, Japanese ink style", style: "outline", category: "Trees", difficulty: "intermediate" },
  { prompt: "A small potted cactus with a single flower bloom, simple flat illustration, desert warm tones", style: "flat", category: "Trees", difficulty: "starter" },
  { prompt: "A weeping willow at the edge of a pond, long draping branches touching the water, painterly watercolor, soft green palette", style: "watercolor", category: "Trees", difficulty: "advanced" },

  // ── Space & Stars ─────────────────────────────────────────────────────────
  { prompt: "A full moon with visible craters, flat circle illustration, silver-grey on deep navy", style: "flat", category: "Space", difficulty: "starter" },
  { prompt: "Planet Saturn with its ring system, clean flat illustration, warm gold and cream rings on a teal background", style: "flat", category: "Space", difficulty: "starter" },
  { prompt: "A shooting star with a long sparkle trail, flat gold graphic on midnight blue, wish upon a star feel", style: "flat", category: "Space", difficulty: "starter" },
  { prompt: "A six-pointed snowflake in precise geometric symmetry, pure white on a deep blue field, crisp linework", style: "outline", category: "Space", difficulty: "intermediate" },
  { prompt: "A retro rocket launching through a spiral galaxy, 1950s pulp sci-fi poster aesthetic, bold complementary colors", style: "vintage", category: "Space", difficulty: "intermediate" },
  { prompt: "A star map of a specific constellation — Orion with connecting lines and labeled stars — antique celestial chart style, ivory and gold", style: "vintage", category: "Space", difficulty: "advanced" },

  // ── Books & Reading ───────────────────────────────────────────────────────
  { prompt: "A stack of four books in different spine colors, clean flat illustration, school or library theme", style: "flat", category: "Books", difficulty: "starter" },
  { prompt: "An open book with a miniature world scene rising from the pages — mountains, trees, hot air balloon — imagination concept", style: "flat", category: "Books", difficulty: "intermediate" },
  { prompt: "A library bookshelf from the front, books of different heights and colors, flat illustration, organized and inviting", style: "flat", category: "Books", difficulty: "intermediate" },
  { prompt: "A quill pen dipped in an inkwell, vintage desk setting, parchment and sepia tones, writing heritage feel", style: "vintage", category: "Books", difficulty: "intermediate" },
  { prompt: "A child reading under a tree while autumn leaves spiral down, warm picture-book illustration style, cozy outdoor scene", style: "cartoon", category: "Books", difficulty: "advanced" },

  // ── Dinosaurs ─────────────────────────────────────────────────────────────
  { prompt: "A T-Rex with tiny arms mid-roar, rounded cartoon style, bold flat fills, charming rather than scary", style: "cartoon", category: "Dinosaurs", difficulty: "starter" },
  { prompt: "A Triceratops in three-quarter view, three bold horns and a wide frill, clean flat side profile", style: "flat", category: "Dinosaurs", difficulty: "starter" },
  { prompt: "A Brachiosaurus with a long neck stretching above cloud level, simple flat silhouette, blue sky implied", style: "flat", category: "Dinosaurs", difficulty: "starter" },
  { prompt: "A raptor mid-sprint in a dynamic leaning pose, geometric low-poly facets, cool grey and teal palette", style: "flat", category: "Dinosaurs", difficulty: "intermediate" },
  { prompt: "A nest of three dinosaur eggs with hairline cracks and baby heads just peeking through, warm sandy palette, tender detail", style: "watercolor", category: "Dinosaurs", difficulty: "advanced" },

  // ── Insects & Bugs ────────────────────────────────────────────────────────
  { prompt: "A honeybee top-down view, wings spread, bold yellow and black stripes, clean flat illustration", style: "flat", category: "Insects", difficulty: "starter" },
  { prompt: "A ladybug on a leaf, round red shell with black polka dots, kawaii round eyes, simple illustration", style: "kawaii", category: "Insects", difficulty: "starter" },
  { prompt: "A dragonfly with detailed iridescent wings, seen from above, delicate watercolor wash in blue-green", style: "watercolor", category: "Insects", difficulty: "intermediate" },
  { prompt: "A firefly glowing yellow-green in a dark summer field, magical flat illustration, dark palette with warm bioluminescent light", style: "flat", category: "Insects", difficulty: "intermediate" },
  { prompt: "A monarch butterfly wing pattern rendered as a repeating surface design, botanical accuracy, symmetrical, warm amber and black", style: "flat", category: "Insects", difficulty: "advanced" },

  // ── Pond & Farm Animals ───────────────────────────────────────────────────
  { prompt: "A green frog sitting on a lily pad, legs tucked, flat cartoon style, bright pond colors", style: "cartoon", category: "Farm & Pond", difficulty: "starter" },
  { prompt: "A yellow rubber duck floating on water, squeaky toy aesthetic, simple clean flat graphic", style: "flat", category: "Farm & Pond", difficulty: "starter" },
  { prompt: "A pink pig with a curly tail and round snout, standing in mud, friendly barnyard cartoon style", style: "cartoon", category: "Farm & Pond", difficulty: "starter" },
  { prompt: "A rooster in profile with a dramatic tail arc and bright red comb, bold silhouette, warm morning palette", style: "flat", category: "Farm & Pond", difficulty: "intermediate" },
  { prompt: "A sea turtle with an intricate shell pattern, swimming upward through sunlit water, detailed illustrative style", style: "watercolor", category: "Farm & Pond", difficulty: "advanced" },

  // ── Fire & Elements ───────────────────────────────────────────────────────
  { prompt: "A campfire with layered orange and yellow flame shapes, simple flat illustration, cozy outdoor feel", style: "flat", category: "Elements", difficulty: "starter" },
  { prompt: "A lightning bolt, angular and electric, bold flat yellow-white, dramatic angle, storm energy", style: "flat", category: "Elements", difficulty: "starter" },
  { prompt: "A stylized ocean wave curling over, bold clean silhouette, Hokusai-inspired but flat and minimal, deep blue", style: "flat", category: "Elements", difficulty: "intermediate" },
  { prompt: "Fire and ice split down the center — left side red flame, right side blue crystal — symmetrical duality concept, editorial flat style", style: "flat", category: "Elements", difficulty: "advanced" },

  // ── Technology & Gadgets ──────────────────────────────────────────────────
  { prompt: "A modern smartphone with a blank screen, ultra-clean flat illustration, minimal product style", style: "flat", category: "Tech", difficulty: "starter" },
  { prompt: "A boxy vintage desktop computer with a CRT monitor, 90s nostalgia, flat retro illustration, warm beige tones", style: "cartoon", category: "Tech", difficulty: "intermediate" },
  { prompt: "A DSLR camera viewed from the front, clean flat graphic, lens centered, dark grey and chrome", style: "flat", category: "Tech", difficulty: "intermediate" },
  { prompt: "A gamepad controller top-down view, dual joysticks and buttons, flat clean design, dark with accent colors", style: "flat", category: "Tech", difficulty: "starter" },
  { prompt: "A vintage television set with bunny-ear antenna, mid-century form, flat retro illustration, warm walnut and cream", style: "vintage", category: "Tech", difficulty: "intermediate" },

  // ── Skulls & Dark Theme ───────────────────────────────────────────────────
  { prompt: "A classic skull with crossed bones beneath, bold flat graphic, stark black and white, pirate flag style", style: "flat", category: "Skulls", difficulty: "starter" },
  { prompt: "A sugar skull (Día de los Muertos) decorated with flowers, diamonds, and swirls — symmetrical, vibrant flat fills, festive not morbid", style: "flat", category: "Skulls", difficulty: "intermediate" },
  { prompt: "A bat in mid-flight seen from the front, wings spread wide, clean flat silhouette, deep purple on dark", style: "flat", category: "Skulls", difficulty: "starter" },
  { prompt: "A spider hanging from a single thread of web, detailed symmetrical web behind it, flat Halloween illustration, black on grey", style: "flat", category: "Skulls", difficulty: "intermediate" },

  // ── Babies & Kids ─────────────────────────────────────────────────────────
  { prompt: "A baby wrapped snugly in a soft blanket with a bow on top, round kawaii shapes, pastel palette", style: "kawaii", category: "Baby", difficulty: "starter" },
  { prompt: "Wooden toy alphabet blocks stacked in an L-shape, letters on visible faces, primary colors, 3D perspective", style: "cartoon", category: "Baby", difficulty: "starter" },
  { prompt: "A child's drawing of a sun, house, and family done in crayon — meta childlike flat illustration, deliberately imperfect lines", style: "doodle", category: "Baby", difficulty: "intermediate" },
  { prompt: "A stork in flight carrying a baby bundle in a cloth sling, silhouette flat graphic, classic birth announcement imagery", style: "flat", category: "Baby", difficulty: "intermediate" },

  // ── Everyday & Utility Objects ────────────────────────────────────────────
  { prompt: "A bold right-pointing arrow, thick and clean, minimal flat graphic, versatile directional icon", style: "flat", category: "Objects", difficulty: "starter" },
  { prompt: "A magnifying glass with a loupe lens, clean flat illustration, detective or search theme", style: "flat", category: "Objects", difficulty: "starter" },
  { prompt: "A pair of scissors open mid-cut along a dotted line, flat illustration, craft and DIY theme", style: "flat", category: "Objects", difficulty: "starter" },
  { prompt: "A popcorn bucket overflowing with popped kernels, red and white striped box, movie night illustration", style: "cartoon", category: "Objects", difficulty: "starter" },
  { prompt: "A disco ball reflecting light rays outward in all directions, metallic tile detail, flat party graphic, silver and gold", style: "flat", category: "Objects", difficulty: "intermediate" },
  { prompt: "A speech bubble containing a bold question mark, clean flat graphic, help or FAQ theme", style: "flat", category: "Objects", difficulty: "starter" },
  { prompt: "A compass rose with eight cardinal points, ornate nautical engraving style, precise symmetry, dark ink on aged paper", style: "vintage", category: "Objects", difficulty: "advanced" },

  // ── Religion & Spirit ─────────────────────────────────────────────────────
  { prompt: "A simple Latin cross, clean flat outline, minimal and reverent, white on a soft neutral field", style: "outline", category: "Religion", difficulty: "starter" },
  { prompt: "A cross with Celtic knotwork woven through the arms, intricate geometric interlacing, single-color precision linework", style: "outline", category: "Religion", difficulty: "advanced" },
  { prompt: "A dove mid-flight carrying an olive branch, peace symbol, flat clean illustration, white on pale blue", style: "flat", category: "Religion", difficulty: "intermediate" },

  // ── Monkeys & Jungle ──────────────────────────────────────────────────────
  { prompt: "A cartoon monkey hanging from a vine by one hand, cheeky grin, tropical jungle feel, flat warm greens", style: "cartoon", category: "Jungle", difficulty: "starter" },
  { prompt: "A gorilla sitting with arms crossed, noble expression, flat illustration, silver-grey back detail", style: "flat", category: "Jungle", difficulty: "intermediate" },
  { prompt: "A colorful toucan on a branch, oversized beak in bright tropical colors, flat graphic, rainforest palette", style: "flat", category: "Jungle", difficulty: "intermediate" },
  { prompt: "A sloth hanging upside down from a branch, sleepy half-closed eyes, shaggy fur detail, watercolor loose style", style: "watercolor", category: "Jungle", difficulty: "advanced" },

  // ── Fox & Forest Creatures ────────────────────────────────────────────────
  { prompt: "A fox kit sitting upright, large ears and fluffy tail curled around its feet, warm flat illustration", style: "flat", category: "Forest", difficulty: "starter" },
  { prompt: "A deer in a misty pine forest, antlers silhouetted, quiet and atmospheric, loose watercolor washes", style: "watercolor", category: "Forest", difficulty: "intermediate" },
  { prompt: "A bear peeking around a tree trunk, only half visible, playful composition, children's book illustration style", style: "cartoon", category: "Forest", difficulty: "intermediate" },
  { prompt: "A wolf howling at the moon, dramatic silhouette on a hilltop, backlit by a large full moon, single-color with moon glow", style: "flat", category: "Forest", difficulty: "advanced" },

  // ── Flowers+ (depth set) ──────────────────────────────────────────────────
  { prompt: "A peony in full bloom, soft layered petals packed tight, blush pink watercolor with pale shadows", style: "watercolor", category: "Flowers", difficulty: "intermediate" },
  { prompt: "Cherry blossom branch with five open blooms and falling petals, Japanese ink brush style, minimal pink on white", style: "outline", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A lotus flower floating on still water, petals fanning open, top-down view, minimal flat illustration", style: "flat", category: "Flowers", difficulty: "starter" },
  { prompt: "A dried lavender bundle tied with twine, flat illustration, purple on warm cream, farmhouse aesthetic", style: "flat", category: "Flowers", difficulty: "starter" },
  { prompt: "A hydrangea cluster with dozens of small florets, soft watercolor wash, lavender-blue, French garden feel", style: "watercolor", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A magnolia branch with two open blooms and a bud, clean botanical line art, white petals on dark branch", style: "outline", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A pressed flower herbarium arrangement — five species labeled and pinned, vintage scientific illustration style", style: "vintage", category: "Flowers", difficulty: "advanced" },
  { prompt: "A thistle with spiky leaves and a purple-topped bloom, Scottish heritage feel, detailed pen and ink", style: "outline", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A tulip garden viewed from above — rows of red, yellow, and white tulips, bold aerial pattern, flat graphic", style: "flat", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A single white orchid stem with two blooms, clean elegant line art, tropical luxury feel, minimal negative space", style: "outline", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A poppy with four translucent scarlet petals and a dark seed pod center, bold graphic, Memorial Day resonance", style: "flat", category: "Flowers", difficulty: "starter" },
  { prompt: "A flower crown of daisies and baby's breath seen from above, circular wreath composition, flat illustration", style: "flat", category: "Flowers", difficulty: "starter" },
  { prompt: "A bouquet wrapped in brown kraft paper and tied with a ribbon, florist gift style, flat warm illustration", style: "flat", category: "Flowers", difficulty: "starter" },
  { prompt: "A cactus flower blooming atop a desert column cactus, vibrant pink on spiky green, flat bold contrast", style: "flat", category: "Flowers", difficulty: "starter" },
  { prompt: "A lily of the valley with tiny bell-shaped flowers hanging from a curved stem, delicate botanical line work", style: "outline", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A pansy with velvety overlapping petals in deep purple and gold, realistic botanical precision, watercolor", style: "watercolor", category: "Flowers", difficulty: "advanced" },
  { prompt: "A floral letter — the capital letter F formed entirely from woven roses, leaves, and tendrils, ornate flat art", style: "flat", category: "Flowers", difficulty: "advanced" },
  { prompt: "Wildflower meadow silhouette at golden hour — stems and seed heads backlit against a warm amber sky", style: "flat", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A sunflower field from ground level looking up toward the sky, bold flat perspective, golden fills, dramatic", style: "flat", category: "Flowers", difficulty: "intermediate" },
  { prompt: "A floral mandala — perfectly symmetrical, eight-fold rotational symmetry, blooms and leaves radiating outward, fine line art", style: "outline", category: "Flowers", difficulty: "advanced" },

  // ── Christmas+ (depth set) ────────────────────────────────────────────────
  { prompt: "A Christmas stocking hung on a fireplace mantel, stuffed with candy canes and small gifts, flat cozy illustration", style: "cartoon", category: "Christmas", difficulty: "starter" },
  { prompt: "A gingerbread man cookie with white icing buttons, smile, and bow tie, flat illustration, warm biscuit tones", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "A candy cane in classic red and white spiral stripes, single object, clean flat graphic", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "An elf with a pointy striped hat and curled-toe shoes, carrying a giant wrapped present, cheerful cartoon", style: "cartoon", category: "Christmas", difficulty: "starter" },
  { prompt: "A string of colored Christmas lights looping in a garland shape, each bulb glowing, flat graphic", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "A classic wooden nutcracker soldier in red and gold uniform, tall hat, big jaw, flat illustration", style: "flat", category: "Christmas", difficulty: "intermediate" },
  { prompt: "Three jingle bells tied together with a red ribbon bow, flat gold illustration, festive and simple", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "Rudolph the reindeer front-facing with a glowing red nose, wide eyes, antlers, flat cartoon style", style: "cartoon", category: "Christmas", difficulty: "starter" },
  { prompt: "An ugly Christmas sweater laid flat — covered in reindeer, snowflakes, and zigzag bands, bold pattern design", style: "flat", category: "Christmas", difficulty: "intermediate" },
  { prompt: "A snow globe on a table, domed glass housing a miniature snowy village scene, flat illustration", style: "flat", category: "Christmas", difficulty: "intermediate" },
  { prompt: "Santa's sleigh in full profile with eight reindeer in line, silhouetted against a full moon, classic flat graphic", style: "flat", category: "Christmas", difficulty: "intermediate" },
  { prompt: "A poinsettia plant with rich red and green leaves in a festive pot, clean flat botanical illustration", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "A Christmas pudding with a blue brandy flame and a sprig of holly on top, flat illustration, British tradition", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "A pair of wool mittens with snowflake embroidery, flat illustration, cozy winter mood, deep red and white", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "Santa's boots and legs disappearing down a chimney, just the red trousers and black boots visible, humorous flat graphic", style: "flat", category: "Christmas", difficulty: "intermediate" },
  { prompt: "A Christmas star tree topper, five-pointed, radiating golden light rays outward, flat warm gold illustration", style: "flat", category: "Christmas", difficulty: "starter" },
  { prompt: "A festive wrapping paper tile pattern — scattered stars, holly sprigs, and tiny gift boxes on red, repeating flat design", style: "flat", category: "Christmas", difficulty: "advanced" },
  { prompt: "A Christmas cracker being pulled from both ends, paper crown just visible inside, colorful flat graphic", style: "cartoon", category: "Christmas", difficulty: "starter" },
  { prompt: "Santa reading a long scroll of names, half-moon glasses perched on his nose, reading pose, warm flat cartoon", style: "cartoon", category: "Christmas", difficulty: "intermediate" },
  { prompt: "A Christmas market stall with a striped awning and hanging lanterns, vintage European holiday market illustration, detailed flat scene", style: "vintage", category: "Christmas", difficulty: "advanced" },

  // ── Hearts+ (depth set) ───────────────────────────────────────────────────
  { prompt: "A heart with angel wings spread on each side, symmetrical flat illustration, white wings with gold tips", style: "flat", category: "Hearts", difficulty: "starter" },
  { prompt: "A neon heart sign — glowing pink tube light in a dark setting, retro diner aesthetic, warm neon glow effect", style: "flat", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A heart padlock with a keyhole, bold flat graphic, love-lock bridge theme, gold and deep red", style: "flat", category: "Hearts", difficulty: "starter" },
  { prompt: "A heart made of roses — red roses arranged to form the outline and fill, florist top-view composition", style: "watercolor", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A pixelated 8-bit heart icon, perfect square grid, pure red pixels on white, retro video game style", style: "pixel", category: "Hearts", difficulty: "starter" },
  { prompt: "Two swans facing each other forming a heart with their necks — clean minimal silhouette, elegant negative space", style: "flat", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A heart formed from the silhouettes of two cupped hands, warm tone, universal love symbol, flat illustration", style: "flat", category: "Hearts", difficulty: "starter" },
  { prompt: "A heart with an EKG heartbeat line running through the center, health-meets-love theme, clean flat graphic", style: "flat", category: "Hearts", difficulty: "starter" },
  { prompt: "A candy conversation heart with two-word message in bold retro type, chalky pastel texture, 1950s lettering style", style: "vintage", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A heart-shaped locket rendered open, hinged, interior holding a tiny painted portrait, detailed flat illustration", style: "flat", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A watercolor heart with loose paint edges and splattered drops, abstract romantic feel, deep red bleeds", style: "watercolor", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A heart mandala — the heart outline filled with concentric rings of lotus petals and geometric patterns, fine line art", style: "outline", category: "Hearts", difficulty: "advanced" },
  { prompt: "A heart made of puzzle pieces, each piece a different pastel shade, connection and teamwork concept, flat", style: "flat", category: "Hearts", difficulty: "starter" },
  { prompt: "A heart balloon drifting upward on a string, flat simple graphic, shiny red with a specular highlight", style: "flat", category: "Hearts", difficulty: "starter" },
  { prompt: "A heart framed by a wreath of olive branches, classic badge composition, deep red and muted olive green", style: "flat", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A sacred heart with crown of thorns, rays and small flames, Mexican folk art color palette, vibrant flat fills", style: "flat", category: "Hearts", difficulty: "advanced" },
  { prompt: "A denim jacket pocket with a small embroidered heart patch, sticker aesthetic, casual and warm, flat illustration", style: "flat", category: "Hearts", difficulty: "intermediate" },
  { prompt: "Two interlinked rings forming a shared heart at the center, wedding or unity theme, fine gold line illustration", style: "outline", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A heart-shaped box of chocolates with the lid off, rows of assorted truffles visible, Valentine's classic, flat", style: "flat", category: "Hearts", difficulty: "intermediate" },
  { prompt: "A heart formed by a single continuous line that loops without lifting — one-line art technique, minimal and clever", style: "outline", category: "Hearts", difficulty: "advanced" },

  // ── Sports+ (depth set) ───────────────────────────────────────────────────
  { prompt: "A boxing glove, single glove facing forward, bold flat graphic, red leather with white lacing detail", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A golf ball balanced on a tee above a fairway, flat simple graphic, white ball, green grass, blue sky", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A running shoe mid-stride, sole angled toward viewer, dynamic perspective, flat athletic illustration", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A hockey puck and stick in a dynamic crossed composition, flat ice sports graphic, black and white", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A cheerleader mid-jump in a high kick, pom-poms raised above her head, flat bold school-spirit illustration", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A dartboard face-on with a dart in the bullseye, clean flat graphic, classic green, red, and black", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A marathon runner breaking the finish-line tape, arms spread wide, flat silhouette, triumphant energy", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A lacrosse stick with a ball cradled in the mesh head, action angle, clean flat sports graphic", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A gold medal on a ribbon — circular medallion with a star, classic athletic achievement, flat illustration", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A surfboard standing upright, long and tapered, with a bold graphic design on the deck, flat side view", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A field hockey stick and ball, clean sport silhouette badge composition, circular frame, grass-green and white", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A barbell with weight plates on both ends, gym equipment flat graphic, clean metallic grey illustration", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A gymnastics ribbon mid-flourish, sweeping curve with a spiral end, elegant flat graphic, bright pink", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A pickleball paddle and ball, clean flat graphic, paddle face with a honeycomb texture, pastel color", style: "flat", category: "Sports", difficulty: "starter" },
  { prompt: "A bicycle in clean side profile, road bike frame geometry, flat line illustration, sporty and minimal", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A wrestling championship belt with a large ornate center plate, bold flat illustration, gold and leather brown", style: "flat", category: "Sports", difficulty: "intermediate" },
  { prompt: "A cricket bat and ball in a crossed-badge composition, oval frame with laurel detail, cream and green palette", style: "vintage", category: "Sports", difficulty: "intermediate" },
  { prompt: "A swimmer mid-stroke in a lane, flat top-down aerial view, turquoise lane lines, splash implied", style: "flat", category: "Sports", difficulty: "advanced" },
  { prompt: "A ski jumper at peak altitude — tiny figure airborne above a vast mountain slope, dramatic scale contrast, flat silhouette", style: "flat", category: "Sports", difficulty: "advanced" },
  { prompt: "A vintage football helmet, leather with a single-bar face mask, aged patina, retro sports badge style", style: "vintage", category: "Sports", difficulty: "advanced" },

  // ── Animals+ (depth set) ──────────────────────────────────────────────────
  { prompt: "A pug staring straight ahead with deep wrinkles and a flat nose, flat cartoon, warm fawn and black", style: "cartoon", category: "Animals", difficulty: "starter" },
  { prompt: "A husky in profile with sharp blue eyes and a thick coat, cool-palette flat illustration, grey and white", style: "flat", category: "Animals", difficulty: "intermediate" },
  { prompt: "A dachshund in full side-body view, impossibly long body and short legs, flat cartoon, warm chestnut tones", style: "cartoon", category: "Animals", difficulty: "starter" },
  { prompt: "A golden retriever mid-leap chasing a frisbee, flat action illustration, warm outdoor colors, joyful energy", style: "flat", category: "Animals", difficulty: "intermediate" },
  { prompt: "A labrador puppy sitting next to an oversized tennis ball, paws too big for its body, flat simple illustration", style: "flat", category: "Animals", difficulty: "starter" },
  { prompt: "A Siamese cat sitting upright, dark face mask and ears, ice-blue eyes, flat elegant illustration", style: "flat", category: "Animals", difficulty: "intermediate" },
  { prompt: "A fluffy Persian cat batting a ball of yarn, flat round cartoon style, grey with a smooshed face", style: "cartoon", category: "Animals", difficulty: "starter" },
  { prompt: "A cat sitting inside an open cardboard box looking suspicious, internet cat culture, flat fun illustration", style: "cartoon", category: "Animals", difficulty: "starter" },
  { prompt: "An orange tabby mid-yawn, showing tiny sharp teeth and a curling tongue, expressive flat cartoon", style: "cartoon", category: "Animals", difficulty: "starter" },
  { prompt: "A kitten curled sleeping inside an oversized teacup, cozy kawaii illustration, soft pastel palette", style: "kawaii", category: "Animals", difficulty: "starter" },
  { prompt: "A white bunny mid-hop, ears swept back, pink nose, flat clean graphic, soft spring palette", style: "flat", category: "Animals", difficulty: "starter" },
  { prompt: "A hamster stuffing its cheeks with seeds, round and ridiculous, kawaii cartoon, warm sandy tones", style: "kawaii", category: "Animals", difficulty: "starter" },
  { prompt: "A parrot perched on a branch, colorful tropical plumage — red, blue, yellow — flat graphic, vivid palette", style: "flat", category: "Animals", difficulty: "intermediate" },
  { prompt: "A flamingo on one leg, long neck curved in an S, coral pink, clean minimal flat illustration", style: "flat", category: "Animals", difficulty: "starter" },
  { prompt: "A giant panda sitting and eating bamboo, classic black-and-white markings, friendly flat illustration", style: "flat", category: "Animals", difficulty: "starter" },
  { prompt: "A raccoon holding a small shiny object, wearing its natural eye-mask, curious expression, flat cartoon", style: "cartoon", category: "Animals", difficulty: "intermediate" },
  { prompt: "A hedgehog curled into a ball viewed from above, spines radiating like a starburst, flat illustration", style: "flat", category: "Animals", difficulty: "intermediate" },
  { prompt: "An otter floating on its back, a clam balanced on its belly, serene expression, loose watercolor, river palette", style: "watercolor", category: "Animals", difficulty: "intermediate" },
  { prompt: "A baby elephant with ears fanned wide and trunk raised, stumbling forward, endearing flat cartoon", style: "cartoon", category: "Animals", difficulty: "starter" },
  { prompt: "A fox and a rabbit sitting side by side facing the same direction, unlikely friends, flat storybook illustration", style: "flat", category: "Animals", difficulty: "advanced" },
];

const CATEGORIES = ["All", ...Array.from(new Set(PROMPTS.map((p) => p.category)))];

const STYLE_THEME: Record<string, { badge: string; badgeBg: string }> = {
  flat:       { badge: "text-pink-600",   badgeBg: "bg-pink-50" },
  cartoon:    { badge: "text-amber-600",  badgeBg: "bg-amber-50" },
  watercolor: { badge: "text-violet-600", badgeBg: "bg-violet-50" },
  vintage:    { badge: "text-orange-600", badgeBg: "bg-orange-50" },
  doodle:     { badge: "text-lime-600",   badgeBg: "bg-lime-50" },
  kawaii:     { badge: "text-rose-600",   badgeBg: "bg-rose-50" },
  outline:    { badge: "text-slate-600",  badgeBg: "bg-slate-50" },
  sticker:    { badge: "text-cyan-600",   badgeBg: "bg-cyan-50" },
  "3d":       { badge: "text-blue-600",   badgeBg: "bg-blue-50" },
};

const DIFFICULTY_LABEL: Record<Difficulty, { label: string; color: string }> = {
  starter:      { label: "Starter",      color: "text-emerald-500" },
  intermediate: { label: "Intermediate", color: "text-amber-500" },
  advanced:     { label: "Advanced",     color: "text-rose-500" },
};

function styleTheme(style: string) {
  return STYLE_THEME[style] ?? { badge: "text-gray-500", badgeBg: "bg-gray-50" };
}

interface PromptLibraryProps {
  onSelect: (prompt: string, style: StyleKey) => void;
}

export function PromptLibrary({ onSelect }: PromptLibraryProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [useCounts, setUseCounts] = useState<Record<string, number>>({});
  const setLastPromptLibraryUseId = useAppStore((s) => s.setLastPromptLibraryUseId);

  const filtered = useMemo(
    () => (activeCategory === "All" ? PROMPTS : PROMPTS.filter((p) => p.category === activeCategory)),
    [activeCategory],
  );

  // Load aggregate use counts for all prompts
  useEffect(() => {
    fetch("/api/prompt-library-counts")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { prompt_text: string; count: number }[] | null) => {
        if (!data) return;
        const map: Record<string, number> = {};
        for (const row of data) map[row.prompt_text] = row.count;
        setUseCounts(map);
      })
      .catch(() => {});
  }, []);

  const trackUse = useCallback(async (entry: PromptEntry) => {
    const sb = createBrowserClient();
    if (!sb) return;
    const { data: { user } } = await sb.auth.getUser();
    const { data } = await sb
      .from("prompt_library_uses")
      .insert({
        prompt_text: entry.prompt,
        category: entry.category,
        style: entry.style,
        difficulty: entry.difficulty,
        user_id: user?.id ?? null,
      })
      .select("id")
      .single();
    // Store the use id so Generator can attribute the generation
    if (data?.id) setLastPromptLibraryUseId(data.id);
    // No optimistic count bump — counts reflect actual generations, loaded from server
  }, [setLastPromptLibraryUseId]);

  return (
    <div className="py-4">
      {/* Section divider */}
      <div className="flex items-center gap-3 pb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tabular-nums text-gray-500">
            {activeCategory === "All" ? PROMPTS.length : filtered.length}
          </span>
          <span className="text-[11px] font-medium tracking-wide text-gray-400">Prompt Ideas</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Category filter */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((entry, i) => {
            const theme = styleTheme(entry.style);
            const diff = DIFFICULTY_LABEL[entry.difficulty];

            return (
              <motion.button
                key={`${entry.category}-${i}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.02, ease: "easeOut" }}
                onClick={() => {
                  void trackUse(entry);
                  onSelect(entry.prompt, entry.style);
                }}
                className="group relative flex flex-col gap-0 overflow-hidden rounded-xl border border-gray-100 bg-white text-left transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80"
              >
                {/* Top meta */}
                <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    {entry.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold ${diff.color}`}>
                      {diff.label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${theme.badge} ${theme.badgeBg}`}>
                      {entry.style}
                    </span>
                  </div>
                </div>

                {/* Prompt text */}
                <p className="flex-1 px-4 pb-3 text-[13px] font-medium leading-snug text-gray-700 group-hover:text-gray-900">
                  {entry.prompt}
                </p>

                {/* Footer action */}
                <div className="flex items-center justify-between border-t border-gray-100/80 px-4 py-2.5">
                  <span className="text-[11px] font-medium text-gray-300 transition-colors group-hover:text-pink-500">
                    Use this prompt
                  </span>
                  <div className="flex items-center gap-2">
                    {(useCounts[entry.prompt] ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold tabular-nums text-gray-300">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                        {useCounts[entry.prompt].toLocaleString()}
                      </span>
                    )}
                    <svg
                      className="h-3.5 w-3.5 text-gray-200 transition-all group-hover:translate-x-0.5 group-hover:text-pink-400"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
