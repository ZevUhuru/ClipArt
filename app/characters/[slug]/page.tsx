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
      <main className="min-h-screen bg-[#f6efe4]">
        <section className="relative overflow-hidden bg-[#14100b] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(180,112,45,0.38),transparent_30%),radial-gradient(circle_at_80%_8%,rgba(236,72,153,0.16),transparent_26%),linear-gradient(135deg,#14100b_0%,#261a10_48%,#0f0c09_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f6efe4] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:pb-14 sm:pt-10">
            <nav className="mb-8 flex items-center gap-1.5 text-xs text-amber-100/60">
              <Link href="/" className="transition-colors hover:text-amber-100">
                Home
              </Link>
              <span className="text-amber-100/30">/</span>
              <Link href="/characters" className="transition-colors hover:text-amber-100">
                Characters
              </Link>
              <span className="text-amber-100/30">/</span>
              <span className="font-semibold text-amber-50">{character.name}</span>
            </nav>

            <div className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="max-w-xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                  Original clip.art character
                </p>
                <h1 className="mt-4 font-serif text-5xl font-black tracking-tight text-amber-50 sm:text-6xl lg:text-7xl">
                  {character.name}
                </h1>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.28em] text-amber-400">
                  {character.epithet}
                </p>
                <p className="mt-6 border-l-2 border-amber-400/70 pl-4 font-serif text-2xl italic leading-9 text-amber-50/90">
                  {character.quote}
                </p>
                <p className="mt-6 text-base leading-7 text-amber-50/72 sm:text-lg">
                  {character.tagline}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-2">
                  {character.profileFacts.map((fact) => (
                    <div
                      key={fact.label}
                      className="rounded-2xl border border-amber-200/15 bg-white/[0.06] px-4 py-3 shadow-sm backdrop-blur"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/80">
                        {fact.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-amber-50">{fact.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {character.traits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full border border-amber-200/20 bg-amber-100/10 px-3 py-1.5 text-xs font-bold text-amber-50/85"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#reference-sheet"
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-gray-950 shadow-xl shadow-amber-950/20 transition-all hover:-translate-y-0.5 hover:bg-amber-300"
                  >
                    View reference sheets
                  </Link>
                  <Link
                    href="/packs/characters"
                    className="inline-flex items-center justify-center rounded-2xl border border-amber-200/25 bg-white/10 px-5 py-3 text-sm font-black text-amber-50 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    Browse character packs
                  </Link>
                </div>
              </div>

              {referenceSheet && (
                <div className="relative">
                  <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-amber-500/30 via-orange-300/10 to-pink-400/20 blur-2xl" />
                  <div className="relative overflow-hidden rounded-[2.25rem] border border-amber-200/20 bg-[#0d0b08] p-2 shadow-2xl shadow-black/40 ring-1 ring-white/10">
                    <div className="relative aspect-[3/2] overflow-hidden rounded-[1.8rem] bg-[#1a140e]">
                      <Image
                        src={referenceSheet.imageUrl}
                        alt={referenceSheet.alt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100vw, 760px"
                        priority
                      />
                    </div>
                    <div className="grid gap-2 p-3 sm:grid-cols-3">
                      {["Turnaround", "Expressions", "Props"].map((label) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-amber-200/10 bg-white/[0.04] px-3 py-2"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                            {label}
                          </p>
                          <p className="mt-1 text-xs text-amber-50/65">Captured in the board</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <CharacterReferenceSheetGallery
          sheets={character.referenceSheets}
          designNotes={character.designNotes}
        />

        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm ring-1 ring-amber-950/5 lg:col-span-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                Story engine
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-950">
                Mystery prompts made for packs, coloring pages, and worksheets
              </h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {character.storyHooks.map((hook) => (
                  <div key={hook} className="rounded-2xl bg-amber-50/70 p-4">
                    <p className="text-sm font-semibold leading-6 text-gray-700">{hook}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white bg-[#21170f] p-6 text-amber-50 shadow-sm ring-1 ring-amber-950/10">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
                Signature props
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Detective kit
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {character.signatureItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-amber-200/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-amber-50/85"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="character-packs" className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                Character bundles
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                {character.name} packs
              </h2>
            </div>
            <p className="text-sm font-semibold text-gray-400">
              {relatedPacks.length} pack{relatedPacks.length === 1 ? "" : "s"}
            </p>
          </div>

          {relatedPacks.length > 0 ? (
            <PackGrid packs={relatedPacks} />
          ) : (
            <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <h2 className="text-base font-black text-gray-950">
                No public {character.name} packs yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Published packs that match this character by slug, title, or tags will appear here.
              </p>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Reference sheets", character.referenceSheets.length, "Turnarounds, expressions, palettes, props, and outfit notes."],
              ["Coloring pages", character.coloringPageSlugs.length, "Future printable Orion scenes and mystery moments."],
              ["Worksheets", character.worksheetSlugs.length, "Future clue trails, reading prompts, vocabulary sheets, and classroom mysteries."],
            ].map(([label, count, description]) => (
              <div key={label} className="rounded-3xl border border-white bg-white p-6 shadow-sm ring-1 ring-amber-950/5">
                <p className="text-3xl font-black text-gray-950">{count}</p>
                <h2 className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-gray-500">
                  {label}
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-500">
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

