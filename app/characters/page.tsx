import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { characters, getCharacterForPack } from "@/data/characters";
import { PackGrid } from "@/components/packs/PackGrid";
import { buildCanonical, DEFAULT_SOCIAL_IMAGE, SITE_NAME } from "@/lib/seo";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "clip.art Characters | Reference Sheets & Packs",
  description:
    "Meet original clip.art characters with reference sheets, themed packs, coloring pages, worksheets, and future story assets.",
  alternates: { canonical: buildCanonical("characters") },
  openGraph: {
    title: "clip.art Characters",
    description:
      "Browse original clip.art characters with reference sheets, themed packs, coloring pages, worksheets, and future story assets.",
    url: buildCanonical("characters"),
    siteName: SITE_NAME,
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "clip.art Characters",
    description: "Browse original clip.art characters and their related creative packs.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  robots: { index: true, follow: true },
};

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

async function getCharacterPacks(): Promise<PackRow[]> {
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
      .filter((pack) => Boolean(getCharacterForPack(pack)))
      .map((pack) => ({
        ...pack,
        categories: { slug: "characters", name: "Characters" },
      }));
  } catch {
    return [];
  }
}

export default async function CharactersPage() {
  const characterPacks = await getCharacterPacks();

  return (
    <main className="min-h-screen bg-[#fbfaf9]">
      <section className="relative overflow-hidden border-b border-gray-100 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(236,72,153,0.14),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(251,146,60,0.18),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-18">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-500">
              Character universe
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Original characters for packs, stories, and classrooms
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Each character page gathers reference sheets, related packs, standalone clip art,
              coloring pages, worksheets, and future story assets under one reusable identity.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/packs/characters"
                className="rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-gray-950/10 transition-all hover:-translate-y-0.5 hover:bg-gray-800"
              >
                Browse character packs
              </Link>
              <Link
                href="#character-index"
                className="rounded-2xl border border-pink-200 bg-white px-5 py-3 text-sm font-black text-pink-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300"
              >
                Meet the characters
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="character-index" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
              Character index
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
              Named clip.art characters
            </h2>
          </div>
          <p className="text-sm font-semibold text-gray-400">
            {characters.length} character{characters.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {characters.map((character) => {
            const referenceSheet = character.referenceSheets[0];
            return (
              <Link
                key={character.slug}
                href={`/characters/${character.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm ring-1 ring-gray-200/70 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-100/70"
              >
                <div className="grid gap-0 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative aspect-[4/3] bg-gray-50 sm:aspect-auto">
                    <Image
                      src={referenceSheet.imageUrl}
                      alt={referenceSheet.alt}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 360px"
                    />
                  </div>
                  <div className="flex flex-col justify-between p-6">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">
                        Character sheet ready
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-gray-950 transition-colors group-hover:text-pink-600">
                        {character.name}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-gray-500">
                        {character.shortDescription}
                      </p>
                    </div>
                    <span className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-gray-900 transition-colors group-hover:text-pink-600">
                      View character
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {characterPacks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                Related bundles
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                Character packs
              </h2>
            </div>
            <Link
              href="/packs/characters"
              className="text-sm font-black text-pink-600 transition-colors hover:text-pink-500"
            >
              View all
            </Link>
          </div>
          <PackGrid packs={characterPacks} />
        </section>
      )}
    </main>
  );
}

