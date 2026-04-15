-- Animal Alphabet SEO Pages: 26 clip art categories (A–Z)
-- Run this in Supabase SQL editor.

-- ─────────────────────────────────────────────
-- 1. Clip art letter categories (type = 'clipart')
-- ─────────────────────────────────────────────

INSERT INTO public.categories (slug, name, h1, meta_title, meta_description, intro, seo_content, suggested_prompts, related_slugs, sort_order, type)
VALUES
  -- ── A ──
  (
    'animals-that-start-with-a',
    'Animals That Start With A',
    'Animals That Start With A Clip Art',
    'Animals That Start With A — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with A. Alligators, anteaters, armadillos, axolotls and more. Generate custom animal illustrations with AI instantly.',
    'From the mighty alligator to the adorable axolotl, explore clip art of every animal that starts with the letter A — or generate your own custom animal illustration with AI in seconds.',
    ARRAY[
      'The letter A boasts one of the richest collections of animals in the alphabet. African elephants (often simply called "African animals") technically belong under E, but plenty of iconic creatures claim A as their own. The alligator is a favorite in educational clip art with its armored body and toothy grin. The arctic fox, with its stunning white winter coat, is a popular choice for winter-themed projects. Anteaters and armadillos bring quirky charm to any design with their unique silhouettes.',
      'Sea and water animals that start with A include the angelfish, a staple of tropical reef illustrations, and the axolotl, the smiling Mexican salamander that has become an internet sensation. The albatross soars over ocean scenes, while the anemone adds color to underwater compositions. Farm and pet animals include the alpaca, beloved for its fluffy coat and gentle expression, and the everyday ant, a favorite in children''s educational materials.',
      'Our AI clip art generator creates custom illustrations of any animal starting with A. Whether you need a realistic alligator for a science project, a cartoon alpaca for a birthday invitation, or a detailed arctic fox for a winter poster, describe your vision and download unique animal clip art in seconds — free for personal and commercial use.'
    ],
    ARRAY[
      'Cute cartoon alligator with a big smile on transparent background',
      'Fluffy white alpaca standing in a meadow',
      'Pink axolotl swimming with feathery gills'
    ],
    ARRAY['animals-that-start-with-b', 'animals-that-start-with-z', 'cat'],
    100,
    'clipart'
  ),

  -- ── B ──
  (
    'animals-that-start-with-b',
    'Animals That Start With B',
    'Animals That Start With B Clip Art',
    'Animals That Start With B — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with B. Bears, butterflies, bald eagles, bison and more. Generate custom animal illustrations with AI instantly.',
    'From grizzly bears to beautiful butterflies, discover clip art of every animal that starts with B — or create your own custom animal artwork with AI.',
    ARRAY[
      'Animals that start with B span an incredible range of habitats and sizes. The bear family alone provides endless clip art variety — from the mighty grizzly bear and polar bear to the cuddly black bear and the bamboo-munching giant panda (whose scientific name starts with B: bear cat). Butterflies are among the most colorful and popular subjects in clip art, perfect for spring designs, garden themes, and children''s projects.',
      'Wild animals starting with B include the bison, an iconic symbol of the American West, the baboon with its distinctive face, and the bobcat, a stealthy predator. Ocean animals include the blue whale, the largest creature ever to live, the beluga whale with its friendly smile, and the barracuda. The bald eagle, America''s national bird, is a perennial favorite for patriotic designs. Farm animals include the beloved bunny rabbit and the billy goat.',
      'Generate custom B-animal clip art with our AI tool. Need a monarch butterfly with detailed wing patterns? A cartoon bear cub for a baby shower? A majestic bison silhouette for a western design? Describe any animal starting with B and get unique, downloadable clip art in seconds.'
    ],
    ARRAY[
      'Grizzly bear standing in a mountain river catching salmon',
      'Colorful monarch butterfly with detailed wing patterns',
      'Cute cartoon bunny rabbit with floppy ears'
    ],
    ARRAY['animals-that-start-with-a', 'animals-that-start-with-c', 'cat'],
    101,
    'clipart'
  ),

  -- ── C ──
  (
    'animals-that-start-with-c',
    'Animals That Start With C',
    'Animals That Start With C Clip Art',
    'Animals That Start With C — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with C. Cats, chameleons, cheetahs, crabs and more. Generate custom animal illustrations with AI instantly.',
    'From cuddly cats to colorful chameleons, find clip art of every animal that starts with C — or generate your own custom animal illustration with AI.',
    ARRAY[
      'The letter C is home to some of the most beloved animals in clip art. The cat reigns supreme as one of the most searched animals online — from playful kittens to elegant Siamese, cat clip art is essential for pet projects, greeting cards, and children''s designs. The cheetah, the fastest land animal, brings dynamic energy to any illustration with its spotted coat and sleek build. Chameleons captivate with their color-changing abilities and curled tails.',
      'Sea creatures starting with C include the crab, clownfish (made famous by animated films), and the coral reef itself as a backdrop. The capybara, the world''s largest rodent, has surged in popularity as a cute, meme-worthy animal. Other wild animals include the caribou, cougar, coyote, and crocodile. Farm animals include chickens and cows, staples of educational and agricultural clip art. The cardinal bird adds a splash of red to any design.',
      'Create custom C-animal clip art instantly with AI. Whether you need a cute cartoon cat for a birthday card, a detailed cheetah for a school poster, or a colorful clownfish for an ocean-themed project, our generator delivers unique illustrations tailored to your description — free to download and use.'
    ],
    ARRAY[
      'Cute orange tabby cat sitting with a curled tail',
      'Cheetah running at full speed across the savanna',
      'Colorful chameleon on a branch changing colors'
    ],
    ARRAY['animals-that-start-with-b', 'animals-that-start-with-d', 'cat'],
    102,
    'clipart'
  ),

  -- ── D ──
  (
    'animals-that-start-with-d',
    'Animals That Start With D',
    'Animals That Start With D Clip Art',
    'Animals That Start With D — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with D. Dolphins, deer, dogs, dragonflies and more. Generate custom animal illustrations with AI instantly.',
    'From playful dolphins to graceful deer, explore clip art of every animal that starts with D — or create your own custom animal artwork with AI in seconds.',
    ARRAY[
      'Animals that start with D include some of the most universally loved creatures. The dolphin is a top choice for ocean-themed clip art — its playful leaps and friendly smile make it perfect for beach designs, marine biology projects, and children''s illustrations. Deer bring woodland elegance to autumn and nature designs, from spotted fawns to majestic bucks with full antlers. Dogs, humanity''s best friend, offer endless breed variety for pet-themed clip art.',
      'The dragonfly is a favorite for garden and nature illustrations with its iridescent wings and delicate form. Ducks and doves are popular in children''s and spring-themed designs. Wild animals include the dingo, Australia''s wild dog, and the Dalmatian, one of the most recognizable spotted breeds. Sea animals starting with D include the dugong, a gentle marine mammal, and the deep-sea dwellers like the dumbo octopus.',
      'Our AI generator creates custom clip art for any D animal. Need a cartoon dolphin jumping through a wave? A realistic deer in an autumn forest? A cute dachshund puppy for a birthday invitation? Describe what you want and download unique animal clip art instantly — free for personal and commercial use.'
    ],
    ARRAY[
      'Dolphin jumping out of the ocean with a splash',
      'Deer with large antlers standing in an autumn forest',
      'Cute cartoon dragonfly with shimmering wings'
    ],
    ARRAY['animals-that-start-with-c', 'animals-that-start-with-e', 'cat'],
    103,
    'clipart'
  ),

  -- ── E ──
  (
    'animals-that-start-with-e',
    'Animals That Start With E',
    'Animals That Start With E Clip Art',
    'Animals That Start With E — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with E. Elephants, eagles, eels, echidnas and more. Generate custom animal illustrations with AI instantly.',
    'From majestic elephants to soaring eagles, discover clip art of every animal that starts with E — or generate your own custom animal illustration with AI.',
    ARRAY[
      'The elephant is the undisputed star of animals starting with E — the largest land animal on Earth, elephants are among the most popular subjects in clip art. African elephants with their large ears and Asian elephants with their smaller, rounded ears both appear frequently in educational materials, zoo themes, and children''s designs. The eagle, particularly the bald eagle, is a powerful symbol of freedom and strength, making it a top choice for patriotic and nature illustrations.',
      'Other notable E animals include the emu, Australia''s largest bird with its shaggy feathers and comical run; the echidna, a spiny egg-laying mammal that fascinates with its uniqueness; and the elk, a majestic member of the deer family popular in wilderness and mountain designs. Sea animals include the electric eel, the emperor penguin (one of the most beloved animals in children''s media), and the enormous elephant seal. The ermine, with its luxurious white winter coat, adds elegance to any design.',
      'Generate custom E-animal clip art with our AI tool. Whether you need a realistic elephant family for a wildlife poster, a cartoon eagle for a school mascot, or an adorable emperor penguin for a winter party invitation, describe your vision and get unique clip art in seconds — free to download.'
    ],
    ARRAY[
      'African elephant family walking across the savanna at sunset',
      'Bald eagle soaring with wings spread wide',
      'Cute emperor penguin chick standing on ice'
    ],
    ARRAY['animals-that-start-with-d', 'animals-that-start-with-f', 'cat'],
    104,
    'clipart'
  ),

  -- ── F ──
  (
    'animals-that-start-with-f',
    'Animals That Start With F',
    'Animals That Start With F Clip Art',
    'Animals That Start With F — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with F. Foxes, flamingos, frogs, falcons and more. Generate custom animal illustrations with AI instantly.',
    'From clever foxes to flamboyant flamingos, find clip art of every animal that starts with F — or create your own custom animal artwork with AI in seconds.',
    ARRAY[
      'The fox is one of the most popular animals in modern illustration and design — the red fox in particular appears everywhere from children''s nursery decor to woodland-themed wedding invitations. Its bushy tail and pointed ears make for an instantly recognizable silhouette. Flamingos bring tropical flair to any design with their signature pink color and elegant one-legged pose, making them a favorite for summer parties, pool themes, and fashion illustration.',
      'Frogs and tree frogs are staples of nature and science clip art, with their bright colors (especially poison dart frogs) making them visually striking subjects. The falcon represents speed and precision in wildlife illustration. Fireflies add a magical glow to summer evening scenes. Sea animals starting with F include the fugu (pufferfish), flounder, and the fantastic flying fish. Farm animals include the familiar farm hen (fowl) and the Friesian cow.',
      'Create custom F-animal clip art with our AI generator. Need a watercolor fox for a woodland nursery print? A neon flamingo for a tropical party banner? A detailed tree frog for a rainforest diorama? Describe any animal starting with F and download unique illustrations in seconds — free for any project.'
    ],
    ARRAY[
      'Red fox sitting in a snowy forest with bushy tail',
      'Pink flamingo standing on one leg in a tropical lagoon',
      'Colorful poison dart frog on a rainforest leaf'
    ],
    ARRAY['animals-that-start-with-e', 'animals-that-start-with-g', 'cat'],
    105,
    'clipart'
  ),

  -- ── G ──
  (
    'animals-that-start-with-g',
    'Animals That Start With G',
    'Animals That Start With G Clip Art',
    'Animals That Start With G — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with G. Giraffes, gorillas, goldfish, grasshoppers and more. Generate custom animal illustrations with AI.',
    'From towering giraffes to gentle gorillas, explore clip art of every animal that starts with G — or generate your own custom animal illustration with AI.',
    ARRAY[
      'The giraffe is the tallest animal on Earth and one of the most recognizable creatures in clip art — its long neck, spotted pattern, and gentle face make it a favorite for children''s rooms, zoo themes, and African wildlife designs. Gorillas bring powerful presence to wildlife illustrations, from silverback portraits to playful baby gorillas. The goldfish is a classic pet illustration subject, appearing in everything from carnival scenes to zen-inspired designs.',
      'Other popular G animals include the gazelle, known for its graceful leaping; the gecko, with its sticky toes and bright colors; the goat, a farm animal staple with its playful personality; and the goose, both wild and domestic. The grasshopper and the glowworm add charm to garden and nature scenes. Sea creatures include the giant squid, the great white shark (one of the ocean''s apex predators), and the graceful green sea turtle. The guinea pig is a beloved pet often featured in children''s illustrations.',
      'Our AI generator creates custom G-animal clip art for any project. Whether you need a cute cartoon giraffe for a baby shower, a powerful gorilla for a sports logo, or a detailed goldfish in a bowl, describe your vision and get unique animal clip art instantly — free for personal and commercial use.'
    ],
    ARRAY[
      'Tall giraffe eating leaves from an acacia tree',
      'Silverback gorilla sitting in a misty jungle',
      'Cute cartoon goldfish swimming in a round bowl'
    ],
    ARRAY['animals-that-start-with-f', 'animals-that-start-with-h', 'cat'],
    106,
    'clipart'
  ),

  -- ── H ──
  (
    'animals-that-start-with-h',
    'Animals That Start With H',
    'Animals That Start With H Clip Art',
    'Animals That Start With H — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with H. Horses, hummingbirds, hedgehogs, hippos and more. Generate custom animal illustrations with AI.',
    'From galloping horses to tiny hummingbirds, discover clip art of every animal that starts with H — or create your own custom animal artwork with AI.',
    ARRAY[
      'The horse is one of the most illustrated animals in history — from wild mustangs to elegant show horses, horse clip art serves equestrian enthusiasts, western themes, farm scenes, and fairy-tale designs alike. The hummingbird, the smallest bird in the world, dazzles with its iridescent feathers and mid-air hovering, making it a top choice for garden and nature illustrations. The hedgehog has become a modern favorite thanks to its cute curled-up pose and tiny face peeking out from spines.',
      'The hippopotamus is a heavyweight of African wildlife clip art, beloved for its round body and wide yawn. Hawks and herons bring drama to sky and wetland scenes. The hamster is a popular pet illustration subject, often shown with stuffed cheeks. The hyena, often misunderstood, adds character to African savanna designs. Sea animals include the hermit crab, horseshoe crab, and the hammerhead shark, whose distinctive head shape makes for striking silhouettes.',
      'Generate custom H-animal clip art with AI. Need a galloping horse for a ranch invitation? A hovering hummingbird for a garden poster? A cute hedgehog curled into a ball? Describe any animal starting with H and download unique clip art in seconds — free to use for any project.'
    ],
    ARRAY[
      'Wild horse galloping across an open prairie at sunset',
      'Hummingbird hovering near a bright red flower',
      'Cute hedgehog curled into a ball with tiny face peeking out'
    ],
    ARRAY['animals-that-start-with-g', 'animals-that-start-with-i', 'cat'],
    107,
    'clipart'
  ),

  -- ── I ──
  (
    'animals-that-start-with-i',
    'Animals That Start With I',
    'Animals That Start With I Clip Art',
    'Animals That Start With I — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with I. Iguanas, ibises, impalas, inchworms and more. Generate custom animal illustrations with AI instantly.',
    'From sun-loving iguanas to leaping impalas, find clip art of every animal that starts with I — or generate your own custom animal illustration with AI.',
    ARRAY[
      'While the letter I has fewer animals than some letters, the ones it claims are visually striking. The iguana is the standout — this prehistoric-looking reptile with its spiny crest and dewlap makes for dramatic clip art, whether depicted as a green iguana basking on a rock or a colorful marine iguana from the Galapagos. The ibis, a wading bird with a distinctive curved beak, appears in wetland and Egyptian-themed illustrations (the sacred ibis was revered in ancient Egypt).',
      'The impala is one of Africa''s most graceful antelopes, famous for its spectacular leaping ability — a leaping impala silhouette makes for dynamic wildlife clip art. The inchworm (or measuring worm) is a children''s favorite, often depicted in cute cartoon form inching along a leaf. Sea animals include the iridescent jellyfish (certain species like the immortal jellyfish), the isopod, and various species of icefish found in Antarctic waters. The Indian elephant is a subspecies that appears frequently in cultural and religious illustration.',
      'Create custom I-animal clip art with our AI generator. Whether you need a detailed iguana for a reptile-themed project, a graceful impala mid-leap for a nature poster, or a cute cartoon inchworm for a children''s book, describe your vision and get unique animal illustrations instantly — free for any use.'
    ],
    ARRAY[
      'Green iguana basking on a sunny rock with spiny crest',
      'Impala leaping gracefully across the African savanna',
      'Cute cartoon inchworm measuring along a green leaf'
    ],
    ARRAY['animals-that-start-with-h', 'animals-that-start-with-j', 'cat'],
    108,
    'clipart'
  ),

  -- ── J ──
  (
    'animals-that-start-with-j',
    'Animals That Start With J',
    'Animals That Start With J Clip Art',
    'Animals That Start With J — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with J. Jaguars, jellyfish, jackrabbits and more. Generate custom animal illustrations with AI instantly.',
    'From powerful jaguars to ethereal jellyfish, explore clip art of every animal that starts with J — or create your own custom animal artwork with AI.',
    ARRAY[
      'The jaguar is the crown jewel of J animals — the largest cat in the Americas, its rosette-patterned coat and muscular build make it one of the most visually stunning animals in wildlife clip art. Often confused with the leopard, the jaguar''s spots have smaller dots inside them, and its stockier frame conveys raw power. The jellyfish is equally captivating in illustration — its translucent bell and trailing tentacles create mesmerizing designs, especially when depicted with bioluminescent glow effects.',
      'The jackrabbit, with its oversized ears, is an iconic desert animal perfect for Southwest and wilderness themes. The jay (blue jay, Steller''s jay) brings vibrant blue to bird illustrations. The jackal appears in African and Middle Eastern wildlife scenes. Other notable J animals include the Japanese macaque (snow monkey, famous for bathing in hot springs), the junco bird, the jabiru stork, and the jerboa, a tiny hopping rodent with enormous hind legs that looks like it belongs in a cartoon.',
      'Our AI generator creates custom J-animal clip art for any project. Need a fierce jaguar prowling through a jungle? A glowing jellyfish floating in deep water? A cartoon jackrabbit racing through the desert? Describe any animal starting with J and download unique illustrations in seconds — free for personal and commercial use.'
    ],
    ARRAY[
      'Jaguar prowling through a lush jungle with rosette spots',
      'Glowing jellyfish floating in deep blue ocean water',
      'Jackrabbit with large ears running through a desert landscape'
    ],
    ARRAY['animals-that-start-with-i', 'animals-that-start-with-k', 'cat'],
    109,
    'clipart'
  ),

  -- ── K ──
  (
    'animals-that-start-with-k',
    'Animals That Start With K',
    'Animals That Start With K Clip Art',
    'Animals That Start With K — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with K. Koalas, kangaroos, kingfishers, kiwis and more. Generate custom animal illustrations with AI.',
    'From cuddly koalas to bouncing kangaroos, discover clip art of every animal that starts with K — or generate your own custom animal illustration with AI.',
    ARRAY[
      'Australia dominates the letter K with some of the most iconic animals in clip art. The kangaroo, with its powerful hind legs and distinctive pouch, is one of the most recognized animals in the world — kangaroo clip art appears in everything from Australian-themed designs to sports logos and children''s alphabet materials. The koala, clinging to its eucalyptus branch with its round fuzzy ears and button nose, is consistently one of the cutest animals in clip art and a top choice for nursery decor and children''s products.',
      'The kingfisher dazzles with its electric blue and orange plumage, making it a favorite for bird and nature illustrations. The kiwi bird, New Zealand''s national symbol, charms with its round flightless body and long beak. The Komodo dragon, the world''s largest lizard, brings prehistoric drama to wildlife illustrations. Other K animals include the kookaburra (with its famous laughing call), the kudu with its spectacular spiral horns, and the koi fish, a staple of Japanese-inspired garden and pond designs.',
      'Create custom K-animal clip art with AI. Whether you need an adorable koala for a baby shower invitation, a kangaroo with a joey in its pouch for a classroom poster, or a stunning koi fish for an Asian-inspired design, describe your vision and download unique animal clip art instantly.'
    ],
    ARRAY[
      'Koala hugging a eucalyptus branch with round fuzzy ears',
      'Kangaroo with a joey peeking out of its pouch',
      'Colorful kingfisher perched on a branch over water'
    ],
    ARRAY['animals-that-start-with-j', 'animals-that-start-with-l', 'cat'],
    110,
    'clipart'
  ),

  -- ── L ──
  (
    'animals-that-start-with-l',
    'Animals That Start With L',
    'Animals That Start With L Clip Art',
    'Animals That Start With L — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with L. Lions, leopards, llamas, ladybugs and more. Generate custom animal illustrations with AI instantly.',
    'From the king of the jungle to lucky ladybugs, find clip art of every animal that starts with L — or create your own custom animal artwork with AI.',
    ARRAY[
      'The lion reigns as the undisputed king of L animals — and arguably all of wildlife clip art. The male lion''s magnificent mane, powerful stance, and regal bearing make it one of the most illustrated animals ever. Lion clip art appears in logos, school mascots, children''s stories, zodiac designs, and African wildlife scenes. The leopard, with its elegant rosette spots and sleek build, is equally stunning, whether depicted lounging in a tree or prowling through the night.',
      'The llama has exploded in popularity in recent years, becoming a favorite in trendy designs, party themes, and humorous illustrations — often depicted wearing sunglasses or a party hat. The ladybug is a beloved insect in children''s clip art with its bright red wings and black spots. The lemur, with its striking ring-tailed pattern and wide eyes, adds Madagascar flair to any design. Sea animals include the lobster, lionfish (with its dramatic striped fins), and the leatherback sea turtle. The lynx brings wild northern forest energy to wildlife illustrations.',
      'Our AI generator creates custom L-animal clip art for any project. Need a majestic lion portrait for a logo? A trendy llama for a party invitation? A cute ladybug for a children''s worksheet? Describe any animal starting with L and get unique clip art in seconds — free to download and use.'
    ],
    ARRAY[
      'Majestic male lion with a full mane on the savanna',
      'Cute llama wearing a colorful blanket and tassels',
      'Red ladybug with black spots sitting on a green leaf'
    ],
    ARRAY['animals-that-start-with-k', 'animals-that-start-with-m', 'cat'],
    111,
    'clipart'
  ),

  -- ── M ──
  (
    'animals-that-start-with-m',
    'Animals That Start With M',
    'Animals That Start With M Clip Art',
    'Animals That Start With M — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with M. Monkeys, moose, manatees, meerkats and more. Generate custom animal illustrations with AI.',
    'From playful monkeys to gentle manatees, explore clip art of every animal that starts with M — or generate your own custom animal illustration with AI.',
    ARRAY[
      'The letter M offers a fantastic range of animals for clip art. Monkeys are endlessly popular — from curious capuchins to wise mandrills, monkey clip art brings energy and personality to children''s designs, jungle themes, and educational materials. The moose is the largest member of the deer family, and its broad palmate antlers create an unmistakable silhouette perfect for wilderness, camping, and northern forest designs. The manatee, often called a "sea cow," charms with its round body and gentle nature.',
      'The meerkat has captured hearts with its upright sentinel pose and social group behavior, making for engaging clip art. Mice are a staple of children''s illustration and storytelling. The macaw brings explosive tropical color with its vivid red, blue, and gold plumage. The manta ray glides through ocean scenes with its enormous wingspan. Other notable M animals include the mongoose, the mountain lion, the moth (especially the dramatic luna moth), the mole with its big digging paws, and the mustang, symbol of the American wild West.',
      'Generate custom M-animal clip art with our AI tool. Need a cheeky monkey swinging from a vine? A majestic moose in an autumn forest? A gentle manatee floating in crystal-clear water? Describe any animal starting with M and download unique illustrations in seconds — free for any use.'
    ],
    ARRAY[
      'Playful monkey swinging from a jungle vine',
      'Bull moose with large antlers in an autumn mountain scene',
      'Gentle manatee floating in clear tropical water'
    ],
    ARRAY['animals-that-start-with-l', 'animals-that-start-with-n', 'cat'],
    112,
    'clipart'
  ),

  -- ── N ──
  (
    'animals-that-start-with-n',
    'Animals That Start With N',
    'Animals That Start With N Clip Art',
    'Animals That Start With N — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with N. Narwhals, nightingales, newts, numbats and more. Generate custom animal illustrations with AI.',
    'From the mythical-looking narwhal to the melodious nightingale, discover clip art of every animal that starts with N — or create your own custom animal artwork with AI.',
    ARRAY[
      'Animals that start with N is one of the most searched animal alphabet queries, and the narwhal is the star attraction. Often called the "unicorn of the sea," the narwhal''s long spiraling tusk and Arctic habitat make it a magical subject for clip art — hugely popular in children''s products, fantasy themes, and ocean designs. The nightingale, celebrated for centuries for its beautiful song, is a classic choice for music-themed and literary illustrations.',
      'The newt is a colorful salamander that appeals to nature and science enthusiasts, with species like the fire-bellied newt offering vivid orange and black patterns. The numbat, an endangered Australian marsupial with striking stripes, is a unique addition to wildlife collections. Other N animals include the nurse shark (a gentle bottom-dweller), the nuthatch (an acrobatic bird that walks headfirst down trees), the nyala (a beautiful spiral-horned antelope), and the nudibranch, one of the ocean''s most brilliantly colored creatures.',
      'Our AI clip art generator creates custom illustrations of any N animal. Whether you need a magical narwhal for a children''s party, a detailed nightingale perched on a branch, or a colorful nudibranch for a marine biology project, describe your vision and get unique animal clip art instantly — free for personal and commercial use.'
    ],
    ARRAY[
      'Narwhal with a spiraling tusk swimming in arctic waters',
      'Nightingale perched on a branch singing under moonlight',
      'Colorful fire-bellied newt on a mossy log'
    ],
    ARRAY['animals-that-start-with-m', 'animals-that-start-with-o', 'cat'],
    113,
    'clipart'
  ),

  -- ── O ──
  (
    'animals-that-start-with-o',
    'Animals That Start With O',
    'Animals That Start With O Clip Art',
    'Animals That Start With O — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with O. Owls, octopuses, otters, ostriches and more. Generate custom animal illustrations with AI.',
    'From wise owls to playful otters, find clip art of every animal that starts with O — or generate your own custom animal illustration with AI in seconds.',
    ARRAY[
      'The owl is the headliner of O animals in clip art — a symbol of wisdom across cultures, owls appear in educational materials, Halloween designs, woodland nursery decor, and nature illustrations. With species ranging from the tiny elf owl to the majestic great horned owl and the stunning snowy owl, there is enormous variety in owl clip art. The octopus is equally popular, with its eight writhing tentacles and remarkable intelligence making it a favorite for ocean themes, marine biology projects, and whimsical illustrations.',
      'The otter — both sea otters floating hand-in-hand and river otters at play — is one of the cutest animals in clip art, perfect for Valentine''s designs, nature themes, and children''s products. The ostrich, the world''s largest bird, adds humor and drama with its long neck and powerful legs. The orangutan, with its shaggy red fur and expressive face, brings personality to primate and rainforest illustrations. Other O animals include the ocelot (a beautifully spotted wild cat), the orca (killer whale), the oriole bird, and the osprey.',
      'Create custom O-animal clip art with our AI generator. Need a wise owl perched on a stack of books? A playful sea otter floating on its back? A detailed octopus with curling tentacles? Describe any animal starting with O and download unique illustrations in seconds — free to use.'
    ],
    ARRAY[
      'Wise owl perched on a branch under a full moon',
      'Sea otter floating on its back holding a starfish',
      'Purple octopus with curling tentacles in deep water'
    ],
    ARRAY['animals-that-start-with-n', 'animals-that-start-with-p', 'cat'],
    114,
    'clipart'
  ),

  -- ── P ──
  (
    'animals-that-start-with-p',
    'Animals That Start With P',
    'Animals That Start With P Clip Art',
    'Animals That Start With P — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with P. Pandas, penguins, parrots, peacocks and more. Generate custom animal illustrations with AI.',
    'From adorable pandas to dazzling peacocks, explore clip art of every animal that starts with P — or create your own custom animal artwork with AI.',
    ARRAY[
      'The letter P is stacked with clip art superstars. The giant panda, with its iconic black-and-white markings and bamboo-munching habits, is one of the most beloved animals in the world and a powerhouse in clip art — appearing in children''s designs, conservation messaging, and cute character illustrations. Penguins are equally adored, from the tiny fairy penguin to the stately emperor penguin, and they dominate winter, Antarctic, and children''s party themes.',
      'The peacock is nature''s most spectacular display of color, with its iridescent tail fan creating stunning clip art for elegant invitations, Indian-inspired designs, and decorative art. Parrots bring tropical vibrancy with their rainbow plumage. The polar bear commands respect in Arctic and winter illustrations. Other P favorites include the platypus (one of nature''s strangest creatures), the porcupine with its protective quills, the pig (a farm animal staple), the panther, the puffin with its colorful beak, and the praying mantis.',
      'Our AI generator creates custom P-animal clip art for any project. Need a cuddly panda eating bamboo for a nursery print? A peacock with its tail fully displayed for a wedding invitation? A cartoon penguin for a winter party? Describe any animal starting with P and get unique clip art in seconds — free to download.'
    ],
    ARRAY[
      'Giant panda sitting and eating bamboo in a forest',
      'Peacock displaying its full iridescent tail feathers',
      'Cute penguin family on an icy Antarctic shore'
    ],
    ARRAY['animals-that-start-with-o', 'animals-that-start-with-q', 'cat'],
    115,
    'clipart'
  ),

  -- ── Q ──
  (
    'animals-that-start-with-q',
    'Animals That Start With Q',
    'Animals That Start With Q Clip Art',
    'Animals That Start With Q — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with Q. Quokkas, quails, quetzals, quolls and more. Generate custom animal illustrations with AI.',
    'From the smiling quokka to the magnificent quetzal, discover clip art of every animal that starts with Q — or generate your own custom animal illustration with AI.',
    ARRAY[
      'The letter Q may have fewer animals than other letters, but the ones it claims are remarkable. The quokka has taken the internet by storm as "the world''s happiest animal" — this small Australian marsupial appears to be perpetually smiling, making it irresistible for cute clip art, social media graphics, and children''s products. The quetzal, particularly the resplendent quetzal of Central America, is one of the most beautiful birds on Earth with its emerald green plumage and extraordinarily long tail feathers.',
      'The quail is a familiar game bird found worldwide, with the California quail''s distinctive head plume making for charming clip art. Bobwhite quail and their chicks are popular in farm and countryside illustrations. The quoll is an endangered Australian marsupial with spotted fur — a unique subject for wildlife clip art. The queen bee appears frequently in both nature illustrations and figurative designs. Sea creatures starting with Q include the queen angelfish, queen conch, and the Queensland grouper.',
      'Create custom Q-animal clip art with our AI generator. Whether you need an adorable smiling quokka for a greeting card, a colorful quetzal for a tropical design, or a quail family for a nature illustration, describe your vision and download unique animal clip art instantly — free for any use.'
    ],
    ARRAY[
      'Smiling quokka sitting on a sunny Australian beach',
      'Resplendent quetzal with long green tail feathers on a branch',
      'California quail with distinctive head plume and chicks'
    ],
    ARRAY['animals-that-start-with-p', 'animals-that-start-with-r', 'cat'],
    116,
    'clipart'
  ),

  -- ── R ──
  (
    'animals-that-start-with-r',
    'Animals That Start With R',
    'Animals That Start With R Clip Art',
    'Animals That Start With R — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with R. Rabbits, raccoons, red pandas, rhinos and more. Generate custom animal illustrations with AI.',
    'From fluffy rabbits to rare red pandas, find clip art of every animal that starts with R — or create your own custom animal artwork with AI in seconds.',
    ARRAY[
      'The rabbit is the undisputed champion of R animals in clip art — a symbol of spring, Easter, and all things cute. Rabbit clip art spans from realistic cottontails and lop-eared breeds to cartoon bunnies and storybook characters, making it one of the most versatile animal subjects in design. The raccoon, with its distinctive black mask and ringed tail, brings mischievous woodland charm to any illustration. The red panda, sometimes called the "firefox," has become a massive favorite in cute animal art with its fluffy red fur and adorable face.',
      'The rhinoceros is a powerful presence in wildlife clip art — both the African white rhino and the critically endangered black rhino make for dramatic illustrations. The reindeer is essential for Christmas and winter holiday designs, from realistic caribou to the famous red-nosed variety. The raven adds dark mystique to Gothic, Halloween, and literary illustrations. Other R animals include the rattlesnake, the robin (a classic sign of spring), the rooster (a farm and morning-themed staple), and the ray (manta rays and stingrays) gliding through ocean scenes.',
      'Our AI generator creates custom R-animal clip art for any project. Need a fluffy bunny rabbit for an Easter card? A cute red panda curled on a branch? A charging rhinoceros for a bold poster? Describe any animal starting with R and download unique illustrations in seconds — free for personal and commercial use.'
    ],
    ARRAY[
      'Fluffy white rabbit sitting in a spring meadow with flowers',
      'Red panda curled on a tree branch with fluffy tail',
      'Raccoon with its black mask peeking out from behind a tree'
    ],
    ARRAY['animals-that-start-with-q', 'animals-that-start-with-s', 'cat'],
    117,
    'clipart'
  ),

  -- ── S ──
  (
    'animals-that-start-with-s',
    'Animals That Start With S',
    'Animals That Start With S Clip Art',
    'Animals That Start With S — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with S. Sharks, snakes, seahorses, sloths and more. Generate custom animal illustrations with AI.',
    'From ocean sharks to smiling sloths, explore clip art of every animal that starts with S — or generate your own custom animal illustration with AI.',
    ARRAY[
      'The letter S has one of the largest animal rosters in the alphabet. The shark reigns as the top ocean predator in clip art — the great white shark, hammerhead, and whale shark all make for powerful marine illustrations. The snake offers incredible diversity, from colorful coral snakes and elegant cobras to massive pythons and friendly garden snakes. The sloth has become a modern clip art sensation, its perpetually relaxed expression and slow lifestyle resonating with people who love cute, laid-back designs.',
      'The seahorse is a unique and popular subject for ocean-themed clip art, with its curled tail and delicate structure. The swan brings elegance to water and fairy-tale scenes. Squirrels add woodland charm with their bushy tails and acorn-hoarding antics. Sea animals starting with S are especially abundant: starfish, sea lions, sea turtles, stingrays, swordfish, and squid. Farm animals include sheep, a staple of pastoral and children''s illustrations. The snow leopard, one of the most beautiful wild cats, adds mountain mystique to wildlife designs.',
      'Generate custom S-animal clip art with our AI tool. Need a fierce great white shark for a marine poster? A cute cartoon sloth hanging from a tree? A colorful seahorse for an underwater theme? Describe any animal starting with S and get unique clip art in seconds — free to download and use.'
    ],
    ARRAY[
      'Great white shark swimming in deep blue ocean',
      'Cute sloth hanging upside down from a tropical tree branch',
      'Colorful seahorse floating among coral and sea plants'
    ],
    ARRAY['animals-that-start-with-r', 'animals-that-start-with-t', 'cat'],
    118,
    'clipart'
  ),

  -- ── T ──
  (
    'animals-that-start-with-t',
    'Animals That Start With T',
    'Animals That Start With T Clip Art',
    'Animals That Start With T — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with T. Tigers, turtles, toucans, tarantulas and more. Generate custom animal illustrations with AI.',
    'From fierce tigers to colorful toucans, discover clip art of every animal that starts with T — or create your own custom animal artwork with AI.',
    ARRAY[
      'The tiger is the largest wild cat and one of the most visually striking animals in all of clip art. Its bold orange and black stripes create instantly recognizable illustrations — from powerful wildlife portraits to cute cartoon tiger cubs. Tiger clip art appears in sports mascots, Chinese zodiac designs, children''s nursery themes, and conservation materials. The turtle and tortoise family offer wonderful variety, from sea turtles gliding through ocean currents to box turtles with their patterned shells and giant Galapagos tortoises.',
      'The toucan, with its enormous colorful beak, is a tropical icon perfect for jungle themes, fruit labels, and vibrant party designs. The tarantula brings dramatic flair to Halloween and exotic pet illustrations. The turkey is essential for Thanksgiving and farm-themed clip art. Other notable T animals include the Tasmanian devil (a fierce marsupial), the tapir (with its distinctive prehensile snout), the tarsier (with enormous eyes), tree frogs, the thorny devil lizard, and the tabby cat.',
      'Our AI generator creates custom T-animal clip art for any project. Need a prowling Bengal tiger for a bold poster? A sea turtle swimming through a coral reef? A colorful toucan perched on a tropical branch? Describe any animal starting with T and download unique illustrations in seconds — free for any use.'
    ],
    ARRAY[
      'Bengal tiger prowling through a lush green jungle',
      'Sea turtle swimming gracefully through a coral reef',
      'Colorful toucan perched on a tropical branch with large beak'
    ],
    ARRAY['animals-that-start-with-s', 'animals-that-start-with-u', 'cat'],
    119,
    'clipart'
  ),

  -- ── U ──
  (
    'animals-that-start-with-u',
    'Animals That Start With U',
    'Animals That Start With U Clip Art',
    'Animals That Start With U — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with U. Unicornfish, umbrellabirds, uakaris and more. Generate custom animal illustrations with AI.',
    'From the exotic umbrellabird to the colorful uakari, discover clip art of every animal that starts with U — or generate your own with AI in seconds.',
    ARRAY[
      'Animals that start with U is one of the most searched letter queries because it is genuinely challenging to name U animals from memory. The umbrellabird, a large tropical bird with a dramatic umbrella-shaped crest and a wattled throat pouch, is visually spectacular in clip art. The uakari, a red-faced South American primate with a strikingly bald crimson head, creates eye-catching wildlife illustrations. The urial, a wild sheep with magnificent curling horns found in Central Asia, adds mountain majesty to any design.',
      'Sea animals starting with U include the unicornfish (a reef fish with a distinctive horn-like projection on its forehead), the urchin (sea urchin, with its globe of protective spines), and the upside-down catfish. The urutu is a venomous South American pit viper with distinctive markings. The unau is another name for the two-toed sloth. For children''s educational projects, U animals provide a great learning opportunity since they''re less commonly known, making clip art especially useful for alphabet activities and animal discovery.',
      'Create custom U-animal clip art with our AI generator. Whether you need a detailed umbrellabird with its striking crest, a red-faced uakari for a primate poster, or a colorful unicornfish for a reef scene, describe your vision and get unique animal illustrations instantly — free to download for personal and commercial use.'
    ],
    ARRAY[
      'Umbrellabird with dramatic black crest in a tropical forest',
      'Red-faced uakari monkey in the Amazon rainforest canopy',
      'Colorful unicornfish swimming along a coral reef'
    ],
    ARRAY['animals-that-start-with-t', 'animals-that-start-with-v', 'cat'],
    120,
    'clipart'
  ),

  -- ── V ──
  (
    'animals-that-start-with-v',
    'Animals That Start With V',
    'Animals That Start With V Clip Art',
    'Animals That Start With V — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with V. Vultures, vipers, vampire bats, vicuñas and more. Generate custom animal illustrations with AI.',
    'From soaring vultures to elusive vicuñas, find clip art of every animal that starts with V — or create your own custom animal artwork with AI.',
    ARRAY[
      'The vulture is the most recognizable V animal — a critical scavenger in ecosystems worldwide. In clip art, vultures range from the dramatic Andean condor (technically a New World vulture) to the bald-headed turkey vulture circling overhead. Their spread-wing silhouette makes for striking desert and savanna illustrations. The viper family of snakes includes some of the most visually dramatic reptiles: the gaboon viper with its geometric patterns, the eyelash viper in vivid green or yellow, and the pit viper with its heat-sensing pits.',
      'The vampire bat brings Halloween and spooky-themed energy to clip art with its fanged face and outstretched wings. The vicuña, a graceful relative of the llama found in the high Andes, has one of the finest coats in the animal kingdom. The vaquita, the world''s most endangered marine mammal, is a tiny porpoise with distinctive dark eye rings that appears in conservation illustrations. Other V animals include the vervet monkey, the vole (a small woodland rodent), the vine snake, and various colorful species of the violet-backed starling.',
      'Our AI generator creates custom V-animal clip art for any project. Need a vulture soaring over a desert canyon? A colorful eyelash viper coiled on a branch? A spooky vampire bat for a Halloween design? Describe any animal starting with V and download unique illustrations in seconds — free to use.'
    ],
    ARRAY[
      'Vulture soaring with spread wings over a desert canyon',
      'Colorful eyelash viper coiled on a tropical branch',
      'Vampire bat with outstretched wings against a full moon'
    ],
    ARRAY['animals-that-start-with-u', 'animals-that-start-with-w', 'cat'],
    121,
    'clipart'
  ),

  -- ── W ──
  (
    'animals-that-start-with-w',
    'Animals That Start With W',
    'Animals That Start With W Clip Art',
    'Animals That Start With W — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with W. Wolves, whales, walruses, wombats and more. Generate custom animal illustrations with AI.',
    'From howling wolves to breaching whales, explore clip art of every animal that starts with W — or generate your own custom animal illustration with AI.',
    ARRAY[
      'The wolf is one of the most iconic animals in illustration — from the lone wolf howling at the moon to a pack running through snow, wolf clip art carries powerful symbolism of strength, loyalty, and wilderness. Wolves appear in fantasy art, nature designs, Native American-inspired illustrations, and sports mascots. The whale offers awe-inspiring scale in ocean clip art — blue whales, humpback whales breaching the surface, and friendly cartoon whales for children''s designs are all perennial favorites.',
      'The walrus, with its enormous tusks and whiskered face, adds Arctic character to polar and marine illustrations. The wombat, Australia''s adorable burrowing marsupial, brings cuddly charm to any design. The woodpecker is a favorite in forest and nature clip art with its red crest and tree-drumming habits. Other W animals include the wolverine (one of the fiercest animals for its size), the warthog with its tusked face, the wasp, the weasel, and the wren. Sea animals include the whale shark, the world''s largest fish, and the walleye.',
      'Generate custom W-animal clip art with our AI tool. Need a wolf howling at the moon for a poster? A breaching humpback whale for a marine design? A cute wombat for a children''s illustration? Describe any animal starting with W and get unique clip art in seconds — free for personal and commercial use.'
    ],
    ARRAY[
      'Wolf howling at a full moon on a snowy mountain ridge',
      'Humpback whale breaching the ocean surface at sunset',
      'Cute wombat sitting in Australian bushland'
    ],
    ARRAY['animals-that-start-with-v', 'animals-that-start-with-x', 'cat'],
    122,
    'clipart'
  ),

  -- ── X ──
  (
    'animals-that-start-with-x',
    'Animals That Start With X',
    'Animals That Start With X Clip Art',
    'Animals That Start With X — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with X. X-ray tetras, xerus squirrels, xenops and more. Generate custom animal illustrations with AI.',
    'From the translucent X-ray tetra to the African xerus, discover clip art of every animal that starts with X — or generate your own with AI in seconds.',
    ARRAY[
      'Animals that start with X is one of the most searched alphabet queries because X is the hardest letter for naming animals. The X-ray tetra is the most well-known X animal — a small freshwater fish with a translucent body that reveals its skeleton, making it visually fascinating for clip art and especially popular in educational materials where children explore the alphabet. The xerus (African ground squirrel) is an energetic, social rodent of African savannas with a bushy tail and upright posture.',
      'The xenops is a small tropical bird of Central and South American rainforests, related to woodcreepers, that forages on tree bark. The Xoloitzcuintli (Mexican hairless dog, often shortened to "Xolo") is one of the world''s oldest and rarest dog breeds, with a sleek hairless body that makes for distinctive pet illustrations. The xiphias (swordfish) is a powerful ocean predator with its signature elongated bill. While X animals are rare, they are highly memorable — making them perfect for alphabet-themed educational clip art and quiz materials.',
      'Create custom X-animal clip art with our AI generator. Whether you need a translucent X-ray tetra for a science project, a xerus squirrel for an African wildlife poster, or a Xoloitzcuintli for a dog breed illustration, describe your vision and get unique animal clip art instantly — free to download and use for any project.'
    ],
    ARRAY[
      'X-ray tetra fish with translucent body showing its skeleton',
      'Xerus African ground squirrel standing upright in the savanna',
      'Xoloitzcuintli Mexican hairless dog in an elegant pose'
    ],
    ARRAY['animals-that-start-with-w', 'animals-that-start-with-y', 'cat'],
    123,
    'clipart'
  ),

  -- ── Y ──
  (
    'animals-that-start-with-y',
    'Animals That Start With Y',
    'Animals That Start With Y Clip Art',
    'Animals That Start With Y — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with Y. Yaks, yellowjackets, yellow tangs and more. Generate custom animal illustrations with AI.',
    'From the shaggy yak to the vibrant yellow tang, find clip art of every animal that starts with Y — or create your own custom animal artwork with AI.',
    ARRAY[
      'The yak is the undisputed star of Y animals — this massive, shaggy-haired bovine of the Himalayan highlands creates instantly recognizable clip art with its long flowing coat and curved horns. Yaks appear in mountain-themed designs, Tibetan and Nepalese cultural illustrations, and alphabet educational materials. The yellowjacket wasp, while not everyone''s favorite in real life, makes for bold clip art with its vivid black and yellow stripes — useful for insect identification charts, summer safety materials, and sports mascot designs.',
      'Sea animals starting with Y include the yellow tang, a brilliantly colored reef fish popular in aquarium illustrations and marine designs, and the yellowfin tuna, a powerful open-ocean fish. The yellow-bellied sea snake is one of the most widespread snakes on Earth. The yabby (Australian freshwater crayfish) appears in Down Under nature scenes. Bird enthusiasts will recognize the yellowhammer and the yellow warbler. The yapok (water opossum) is the world''s only aquatic marsupial, a unique subject for wildlife illustration.',
      'Our AI generator creates custom Y-animal clip art for any project. Need a majestic yak on a snowy mountain pass? A bright yellow tang for an aquarium poster? A detailed yellowjacket for an insect identification chart? Describe any animal starting with Y and download unique illustrations in seconds — free for any use.'
    ],
    ARRAY[
      'Shaggy yak standing on a snowy Himalayan mountain pass',
      'Bright yellow tang fish swimming near a coral reef',
      'Yellowjacket wasp with vivid black and yellow stripes'
    ],
    ARRAY['animals-that-start-with-x', 'animals-that-start-with-z', 'cat'],
    124,
    'clipart'
  ),

  -- ── Z ──
  (
    'animals-that-start-with-z',
    'Animals That Start With Z',
    'Animals That Start With Z Clip Art',
    'Animals That Start With Z — Free Clip Art | clip.art',
    'Browse free clip art of animals that start with Z. Zebras, zebrafish, zorillas and more. Generate custom animal illustrations with AI instantly.',
    'From the iconic striped zebra to the tiny zebrafish, explore clip art of every animal that starts with Z — or generate your own custom animal illustration with AI.',
    ARRAY[
      'The zebra is the undisputed king of Z animals and one of the most visually distinctive creatures on Earth. Its bold black-and-white stripes make it a graphic designer''s dream — zebra clip art works beautifully in African wildlife scenes, zoo themes, alphabet materials, and modern decorative art where the stripe pattern itself becomes a design element. Each zebra''s stripe pattern is unique, like a fingerprint, and the three species (plains, mountain, and Grevy''s) each have subtly different stripe patterns.',
      'Beyond the zebra, Z animals include the zebrafish (a small freshwater fish widely used in scientific research, with horizontal blue and silver stripes), the zebu (a humped domestic cattle breed from South Asia and Africa), and the zorilla (African striped polecat, resembling a skunk). The zonkey (zebra-donkey hybrid) and zorse (zebra-horse hybrid) are rare but visually striking subjects. The zone-tailed hawk and the zigzag heron add avian variety. For ocean life, the zebra shark (leopard shark) brings spotted and striped patterns to marine illustrations.',
      'Generate custom Z-animal clip art with our AI tool. Need a zebra with vivid stripes on the African plains? A zebrafish for a science illustration? A zebu for a world cultures project? Describe any animal starting with Z and get unique clip art in seconds — free to download for personal and commercial use.'
    ],
    ARRAY[
      'Zebra with bold black and white stripes on the African savanna',
      'Zebrafish with blue and silver horizontal stripes',
      'Zebu cattle with distinctive hump in a pastoral scene'
    ],
    ARRAY['animals-that-start-with-y', 'animals-that-start-with-a', 'cat'],
    125,
    'clipart'
  )
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. Cross-link: update existing 'cat' clipart category
-- ─────────────────────────────────────────────

UPDATE public.categories
SET related_slugs = ARRAY['animals-that-start-with-c', 'animals-that-start-with-a', 'animals-that-start-with-k', 'animals-that-start-with-l', 'flower', 'heart', 'halloween']
WHERE slug = 'cat'
  AND type = 'clipart';
