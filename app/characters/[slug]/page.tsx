import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  characters,
  getCharacterBySlug,
  getCharacterForPack,
  type ClipArtCharacter,
} from "@/data/characters";
import { getPackArtworkForPack } from "@/data/packArtwork";
import { CharacterReferenceSheetGallery } from "@/components/characters/CharacterReferenceSheetGallery";
import { PackGrid } from "@/components/packs/PackGrid";
import { buildCanonical, DEFAULT_SOCIAL_IMAGE, SITE_NAME } from "@/lib/seo";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

interface PackRow {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  item_count: number;
  content_types: string[];
  formats: string[];
  is_free: boolean;
  price_cents: number | null;
  downloads: number;
  tags: string[];
  categories: { slug: string; name: string } | null;
}

export function generateStaticParams() {
  return characters.map((character) => ({ slug: character.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const character = getCharacterBySlug(slug);
  if (!character) return {};

  const referenceSheet = character.referenceSheets[0];
  const canonical = buildCanonical(`characters/${character.slug}`);

  return {
    title: `${character.name} Character Packs | clip.art`,
    description: character.shortDescription,
    alternates: { canonical },
    openGraph: {
      title: `${character.name} Character Packs`,
      description: character.shortDescription,
      url: canonical,
      siteName: SITE_NAME,
      type: "profile",
      images: referenceSheet
        ? [{ url: referenceSheet.imageUrl, alt: referenceSheet.alt }]
        : [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${character.name} Character Packs`,
      description: character.shortDescription,
      images: [referenceSheet?.imageUrl || DEFAULT_SOCIAL_IMAGE.url],
    },
    robots: { index: true, follow: true },
  };
}

async function getRelatedPacks(character: ClipArtCharacter): Promise<PackRow[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("packs")
      .select(
        "id, title, slug, cover_image_url, item_count, content_types, formats, is_free, price_cents, downloads, tags, categories!category_id(slug, name)",
      )
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("downloads", { ascending: false })
      .limit(200);

    return ((data || []) as PackRow[])
      .filter((pack) => {
        const matchedCharacter = getCharacterForPack(pack);
        return matchedCharacter?.slug === character.slug;
      })
      .map((pack) => ({
        ...pack,
        cover_image_url: getPackArtworkForPack(pack)?.imageUrl || pack.cover_image_url,
        categories: { slug: character.primaryCategorySlug, name: "Characters" },
      }));
  } catch {
    return [];
  }
}

export default async function CharacterDetailPage({ params }: Props) {
  const { slug } = await params;
  const character = getCharacterBySlug(slug);
  if (!character) notFound();

  const relatedPacks = await getRelatedPacks(character);
  const referenceSheet = character.referenceSheets[0];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: character.name,
      description: character.shortDescription,
      url: buildCanonical(`characters/${character.slug}`),
      image: referenceSheet?.imageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://clip.art" },
        { "@type": "ListItem", position: 2, name: "Characters", item: buildCanonical("characters") },
        {
          "@type": "ListItem",
          position: 3,
          name: character.name,
          item: buildCanonical(`characters/${character.slug}`),
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#0b0805] text-[#efe1bf] [background-image:radial-gradient(circle_at_18%_12%,rgba(140,78,28,0.32),transparent_28%),radial-gradient(circle_at_82%_4%,rgba(88,20,42,0.34),transparent_30%)]">
        <section className="relative overflow-hidden border-b border-[#7a5128]/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,181,91,0.12),transparent_42%),linear-gradient(135deg,rgba(12,9,6,0.92),rgba(35,20,11,0.84)_46%,rgba(10,7,5,0.96))]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d69b4d]/70 to-transparent" />
          <div className="relative mx-auto max-w-[1500px] px-4 pb-10 pt-8 sm:pb-14 sm:pt-10">
            <nav className="mb-7 flex items-center gap-1.5 text-xs text-[#c9a979]/70">
              <Link href="/" className="transition-colors hover:text-[#f4d393]">
                Home
              </Link>
              <span className="text-[#8a6233]/70">/</span>
              <Link href="/characters" className="transition-colors hover:text-[#f4d393]">
                Characters
              </Link>
              <span className="text-[#8a6233]/70">/</span>
              <span className="font-semibold text-[#f4d393]">{character.name}</span>
            </nav>

            <div className="relative border border-[#9a6a35]/55 bg-[#120d08]/86 p-3 shadow-2xl shadow-black/50 ring-1 ring-[#f0c070]/10">
              <div className="pointer-events-none absolute -left-px -top-px h-8 w-8 border-l border-t border-[#d6a65b]" />
              <div className="pointer-events-none absolute -right-px -top-px h-8 w-8 border-r border-t border-[#d6a65b]" />
              <div className="pointer-events-none absolute -bottom-px -left-px h-8 w-8 border-b border-l border-[#d6a65b]" />
              <div className="pointer-events-none absolute -bottom-px -right-px h-8 w-8 border-b border-r border-[#d6a65b]" />

              <div className="grid gap-3 lg:grid-cols-[0.38fr_0.62fr]">
                <div className="border border-[#7f562b]/60 bg-[#19110a]/88 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#d8a852]">
                    Original clip.art character
                  </p>
                  <h1 className="mt-5 font-serif text-6xl font-black leading-[0.88] tracking-tight text-[#f4ead2] sm:text-7xl lg:text-8xl">
                    {character.name.split(" ").map((part) => (
                      <span key={part} className="block">
                        {part}
                      </span>
                    ))}
                  </h1>
                  <p className="mt-4 border-y border-[#7f562b]/70 py-2 text-xs font-black uppercase tracking-[0.34em] text-[#d8a852]">
                    {character.epithet}
                  </p>
                  <p className="mt-6 border-l border-[#d8a852] pl-4 font-serif text-2xl italic leading-9 text-[#f5e7c8]">
                    {character.quote}
                  </p>
                  <p className="mt-6 text-base leading-7 text-[#dac6a2]">
                    {character.tagline}
                  </p>

                  <div className="mt-7 border border-[#7f562b]/70">
                    <div className="border-b border-[#7f562b]/70 bg-[#21170d] px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#d8a852]">
                        Character profile
                      </p>
                    </div>
                    <div className="grid grid-cols-2">
                      {character.profileFacts.map((fact) => (
                        <div
                          key={fact.label}
                          className="border-b border-r border-[#7f562b]/50 px-3 py-3 last:border-r-0"
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b88a48]">
                            {fact.label}
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#f4ead2]">{fact.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 border border-[#7f562b]/70 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#d8a852]">
                      Key traits
                    </p>
                    <div className="mt-3 grid gap-2">
                      {character.traits.map((trait) => (
                        <div key={trait} className="flex items-center gap-2 text-sm font-semibold text-[#ead6b0]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#d8a852]" />
                          {trait}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    <Link
                      href="#reference-sheet"
                      className="border border-[#d8a852]/70 bg-[#d8a852] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-[#120d08] transition-all hover:bg-[#f1c46d]"
                    >
                      View sheets
                    </Link>
                    <Link
                      href="/packs/characters"
                      className="border border-[#9a6a35]/70 bg-[#120d08] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-[#f3d99f] transition-all hover:bg-[#24170d]"
                    >
                      Character packs
                    </Link>
                  </div>
                </div>

                {referenceSheet && (
                  <div className="border border-[#7f562b]/60 bg-[#0d0a07] p-3">
                    <div className="relative aspect-[3/2] overflow-hidden border border-[#9a6a35]/60 bg-[#080604]">
                      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_30%_18%,transparent_0,rgba(0,0,0,0.16)_52%,rgba(0,0,0,0.44)_100%)]" />
                      <Image
                        src={referenceSheet.imageUrl}
                        alt={referenceSheet.alt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100vw, 900px"
                        priority
                      />
                      <div className="absolute left-3 top-3 z-20 border border-[#9a6a35]/70 bg-[#0d0a07]/82 px-3 py-2 backdrop-blur-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#d8a852]">
                          Master reference board
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {["Turnaround", "Expressions", "Props"].map((label) => (
                        <div
                          key={label}
                          className="border border-[#7f562b]/60 bg-[#19110a] px-3 py-3"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8a852]">
                            {label}
                          </p>
                          <p className="mt-1 text-xs text-[#bda27a]">Captured in the board</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <CharacterReferenceSheetGallery
          sheets={character.referenceSheets}
          designNotes={character.designNotes}
        />

        <section className="mx-auto max-w-[1500px] px-4 pb-12">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="border border-[#7f562b]/60 bg-[#15100a] p-6 shadow-xl shadow-black/20 lg:col-span-2">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#d8a852]">
                Story engine
              </p>
              <h2 className="mt-2 font-serif text-3xl font-black tracking-tight text-[#f4ead2]">
                Mystery prompts made for packs, coloring pages, and worksheets
              </h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {character.storyHooks.map((hook) => (
                  <div key={hook} className="border border-[#7f562b]/55 bg-[#21170d] p-4">
                    <p className="text-sm font-semibold leading-6 text-[#dac6a2]">{hook}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#7f562b]/60 bg-[#21170f] p-6 text-[#f4ead2] shadow-xl shadow-black/20">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#d8a852]">
                Signature props
              </p>
              <h2 className="mt-2 font-serif text-3xl font-black tracking-tight">
                Detective kit
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {character.signatureItems.map((item) => (
                  <span
                    key={item}
                    className="border border-[#8a6233]/70 bg-[#120d08] px-3 py-1.5 text-xs font-bold text-[#ead6b0]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="character-packs" className="mx-auto max-w-[1500px] px-4 py-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#d8a852]">
                Character bundles
              </p>
              <h2 className="mt-1 font-serif text-3xl font-black tracking-tight text-[#f4ead2]">
                {character.name} packs
              </h2>
            </div>
            <p className="text-sm font-semibold text-[#9f845e]">
              {relatedPacks.length} pack{relatedPacks.length === 1 ? "" : "s"}
            </p>
          </div>

          {relatedPacks.length > 0 ? (
            <PackGrid packs={relatedPacks} />
          ) : (
            <div className="border border-dashed border-[#7f562b]/70 bg-[#15100a] px-6 py-16 text-center">
              <h2 className="text-base font-black text-[#f4ead2]">
                No public {character.name} packs yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#9f845e]">
                Published packs that match this character by slug, title, or tags will appear here.
              </p>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-[1500px] px-4 pb-14">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Reference sheets", character.referenceSheets.length, "Turnarounds, expressions, palettes, props, and outfit notes."],
              ["Coloring pages", character.coloringPageSlugs.length, "Future printable Orion scenes and mystery moments."],
              ["Worksheets", character.worksheetSlugs.length, "Future clue trails, reading prompts, vocabulary sheets, and classroom mysteries."],
            ].map(([label, count, description]) => (
              <div key={label} className="border border-[#7f562b]/60 bg-[#15100a] p-6 shadow-xl shadow-black/20">
                <p className="font-serif text-4xl font-black text-[#f4ead2]">{count}</p>
                <h2 className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-[#d8a852]">
                  {label}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#9f845e]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

