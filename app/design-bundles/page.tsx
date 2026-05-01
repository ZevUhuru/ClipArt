import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminOnly } from "@/components/AdminOnly";
import { MarketingFooter } from "@/components/MarketingFooter";
import { buildCanonical, DEFAULT_SOCIAL_IMAGE, SITE_NAME } from "@/lib/seo";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { packPath } from "@/lib/packRoutes";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Design Bundles for Creative Sellers | clip.art",
  description:
    "Create beautiful clip art design bundles for Etsy shops, classrooms, social posts, printables, invitations, and seasonal campaigns with clip.art.",
  alternates: { canonical: buildCanonical("design-bundles") },
  openGraph: {
    title: "Design Bundles for Creative Sellers | clip.art",
    description:
      "Create polished clip art design bundles for Etsy, classrooms, social posts, printables, and seasonal campaigns with clip.art.",
    url: buildCanonical("design-bundles"),
    siteName: SITE_NAME,
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Design Bundles for Creative Sellers | clip.art",
    description:
      "Create polished clip art design bundles for Etsy, classrooms, printables, and seasonal campaigns.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  robots: { index: true, follow: true },
};

interface PackPreview {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  item_count: number;
  is_free: boolean;
  price_cents: number | null;
  categories: { slug: string; name: string } | null;
}

const USE_CASES = [
  "Etsy listings",
  "Classroom printables",
  "Pinterest pins",
  "Instagram posts",
  "Craft shop drops",
  "Seasonal campaigns",
];

const STEPS = [
  "Shape the bundle idea",
  "Generate matching assets",
  "Curate the cover and ZIP",
  "Share or export the pack",
];

async function getPackPreviews(): Promise<PackPreview[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("packs")
      .select(
        "id, title, slug, description, cover_image_url, item_count, is_free, price_cents, categories!category_id(slug, name)",
      )
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("is_featured", { ascending: false })
      .order("downloads", { ascending: false })
      .limit(8);

    return (data || []) as PackPreview[];
  } catch {
    return [];
  }
}

function priceLabel(pack: PackPreview) {
  if (pack.is_free) return "Free";
  if (!pack.price_cents) return "Paid";
  return `$${(pack.price_cents / 100).toFixed(0)}`;
}

function BundleMosaic({ packs }: { packs: PackPreview[] }) {
  const visible = packs.filter((pack) => pack.cover_image_url).slice(0, 6);

  if (visible.length === 0) {
    return (
      <div className="rounded-[2rem] border border-pink-100 bg-white p-4 shadow-xl shadow-pink-100/50">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-[1.25rem] bg-gradient-to-br from-pink-50 via-orange-50 to-white ${
                index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-pink-100 bg-white p-3 shadow-xl shadow-pink-100/50">
      <div className="grid grid-cols-3 gap-2">
        {visible.map((pack, index) => (
          <Link
            key={pack.id}
            href={packPath(pack)}
            aria-label={`View ${pack.title} pack`}
            title={`View ${pack.title} pack`}
            className={`group relative overflow-hidden rounded-[1.25rem] bg-transparency-grid ring-1 ring-gray-100 ${
              index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
            }`}
          >
            <Image
              src={pack.cover_image_url!}
              alt={`${pack.title} design bundle preview`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={index === 0}
              sizes={index === 0 ? "(max-width: 1024px) 66vw, 520px" : "(max-width: 1024px) 33vw, 220px"}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="line-clamp-1 text-xs font-black text-white">{pack.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function DesignBundlesLandingPage() {
  const packs = await getPackPreviews();
  const leadPack = packs[0];
  const totalAssets = packs.reduce((sum, pack) => sum + (pack.item_count || 0), 0);

  return (
    <main className="min-h-screen bg-[#fbfaf9] text-gray-950">
      <section className="relative overflow-hidden border-b border-pink-100/60 bg-[linear-gradient(135deg,#fff_0%,#fff7ed_48%,#fdf2f8_100%)]">
        <div className="absolute left-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-pink-200/35 blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-96 w-96 rounded-full bg-orange-200/35 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-24">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white/80 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-pink-600 shadow-sm backdrop-blur"
            >
              <span className="h-2 w-2 rounded-full bg-pink-500" />
              clip.art design bundles
            </Link>

            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-gray-950 sm:text-6xl lg:text-7xl">
              Build with sets, not scattered singles.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Create polished clip art bundles for Etsy shops, classrooms, printables, social posts, invitations,
              worksheets, and seasonal campaigns. Build from a cohesive bundle brief, then publish a public pack page.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AdminOnly>
                <Link
                  href="/create/packs"
                  className="inline-flex items-center justify-center rounded-2xl bg-gray-950 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-gray-950/15 transition-all hover:-translate-y-0.5 hover:bg-gray-800"
                >
                  Start a bundle
                </Link>
              </AdminOnly>
              <Link
                href="/packs"
                className="inline-flex items-center justify-center rounded-2xl border border-pink-100 bg-white px-6 py-3.5 text-sm font-black text-pink-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-200"
              >
                Browse packs
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {USE_CASES.map((useCase) => (
                <span key={useCase} className="rounded-full border border-pink-100 bg-white/75 px-3 py-1.5 text-xs font-bold text-gray-600">
                  {useCase}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <BundleMosaic packs={packs} />
            {leadPack && (
              <div className="absolute -bottom-6 left-6 right-6 rounded-[1.5rem] border border-gray-100 bg-white/95 p-4 shadow-xl shadow-gray-950/10 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                  Featured pack
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="line-clamp-1 text-lg font-black tracking-tight text-gray-950">
                      {leadPack.title}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {leadPack.item_count} assets · {priceLabel(leadPack)}
                    </p>
                  </div>
                  <Link
                    href={packPath(leadPack)}
                    className="shrink-0 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-black text-pink-600 transition-colors hover:bg-pink-100"
                  >
                    View pack
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step} className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black text-pink-500">0{index + 1}</p>
              <p className="mt-3 text-sm font-black text-gray-900">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-500">
            Seller-grade bundles
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">
            Every pack needs a buyer, a use case, and visual proof.
          </h2>
          <p className="mt-5 text-base leading-7 text-gray-600">
            The bundle workflow keeps the brief, assets, cover, ZIP, and public page together so a collection
            reads like a product before it ever reaches Etsy, Pinterest, or your classroom download folder.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50 p-5">
              <p className="text-3xl font-black text-gray-950">{packs.length || 0}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-widest text-orange-600">Live packs</p>
            </div>
            <div className="rounded-[1.5rem] border border-pink-100 bg-pink-50 p-5">
              <p className="text-3xl font-black text-gray-950">{totalAssets || "100+"}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-widest text-pink-600">Pack assets</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {packs.slice(0, 4).map((pack) => (
            <Link
              key={pack.id}
              href={packPath(pack)}
              className="group overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/60"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-transparency-grid">
                {pack.cover_image_url && (
                  <Image
                    src={pack.cover_image_url}
                    alt={`${pack.title} bundle cover`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 320px"
                  />
                )}
              </div>
              <div className="px-2 pb-2 pt-4">
                <p className="line-clamp-1 text-base font-black tracking-tight text-gray-950">{pack.title}</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  {pack.item_count} assets · {pack.categories?.name || "Creative"} · {priceLabel(pack)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl shadow-gray-950/5">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[linear-gradient(135deg,#fff7ed,#fdf2f8)] p-8 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-500">
                Distribution-ready
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                Create the bundle in clip.art. Share the product wherever buyers discover it.
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-600">
                `/design-bundles` is the public promise. `/packs` is the in-app storefront. Admin-only bundle tools
                handle creation, pricing, ZIPs, sharing, and eventually Etsy draft export.
              </p>
            </div>
            <div className="grid gap-3 bg-gray-950 p-6 text-white sm:grid-cols-2 sm:p-8">
              {["Public pack pages", "Pinterest share assets", "Instagram copy and download", "Etsy draft export"].map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/10 bg-white/[0.08] p-5">
                  <p className="text-sm font-black">{feature}</p>
                  <p className="mt-2 text-xs leading-5 text-white/55">
                    Owned by clip.art as distribution and commerce, not by ESY generation infrastructure.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

