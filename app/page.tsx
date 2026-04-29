import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Generator } from "@/components/Generator";
import { MosaicBackground, type MosaicAnimation } from "@/components/MosaicBackground";
import { MarketingFooter } from "@/components/MarketingFooter";
import { getAllCategories, type DbCategory } from "@/lib/categories";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { sampleImages, type SampleImage } from "@/data/sampleGallery";
import { getCategorySlugForImage } from "@/data/categories";
import { STYLE_LABELS, VALID_STYLES, type StyleKey } from "@/lib/styles";

export const revalidate = 60;

interface CommunityImage {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  transparent_image_url?: string | null;
  has_transparency?: boolean;
  style: string;
  category: string;
  slug: string | null;
  aspect_ratio: string;
}

interface HomeVisual {
  key: string;
  title: string;
  slug: string;
  category: string;
  url: string;
  transparentUrl?: string | null;
  hasTransparency?: boolean;
  style?: string;
}

interface HomepagePack {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  item_count: number;
  content_types: string[];
  formats: string[];
  is_free: boolean;
  categories: { slug: string; name: string } | null;
}

async function getCommunityGallery(): Promise<CommunityImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data: featured } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, transparent_image_url, has_transparency, style, category, slug, aspect_ratio")
      .eq("is_public", true)
      .eq("is_featured", true)
      .eq("content_type", "clipart")
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(32);

    if (featured && featured.length >= 24) return featured as CommunityImage[];

    const featuredList = (featured || []) as CommunityImage[];
    const existing = new Set(featuredList.map((f) => f.id));
    const remaining = 32 - featuredList.length;
    const { data: recent } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, transparent_image_url, has_transparency, style, category, slug, aspect_ratio")
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .eq("is_featured", false)
      .order("created_at", { ascending: false })
      .limit(remaining);

    const recentList = (recent || []) as CommunityImage[];
    return [...featuredList, ...recentList.filter((r) => !existing.has(r.id))].slice(0, 32);
  } catch {
    return [];
  }
}

async function getHomepagePacks(): Promise<HomepagePack[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("packs")
      .select("id, title, slug, cover_image_url, item_count, content_types, formats, is_free, categories!category_id(slug, name)")
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("is_featured", { ascending: false })
      .order("downloads", { ascending: false })
      .limit(6);
    return (data || []) as HomepagePack[];
  } catch {
    return [];
  }
}

interface HomepageAnimation {
  id: string;
  videoUrl: string;
  posterUrl: string;
  prompt: string;
  style: string;
  category: string;
  slug: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnimation(a: any): HomepageAnimation {
  const src = a.source as Record<string, string> | null;
  return {
    id: a.id,
    videoUrl: a.preview_url || a.video_url,
    posterUrl: src?.image_url || a.thumbnail_url || "",
    prompt: src?.prompt || a.prompt,
    style: src?.style || "flat",
    category: src?.category || "free",
    slug: src?.slug || a.id,
  };
}

const ANIMATION_SELECT =
  "id, prompt, video_url, preview_url, thumbnail_url, " +
  "source:generations!animations_source_generation_id_fkey(id, image_url, prompt, style, category, slug)";

async function getMosaicAnimations(): Promise<HomepageAnimation[]> {
  try {
    const admin = createSupabaseAdmin();

    const { data: mosaic } = await admin
      .from("animations")
      .select(ANIMATION_SELECT)
      .eq("status", "completed")
      .eq("is_public", true)
      .eq("is_mosaic", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (mosaic && mosaic.length > 0) return mosaic.map(mapAnimation);

    const { data: fallback } = await admin
      .from("animations")
      .select(ANIMATION_SELECT)
      .eq("status", "completed")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6);

    return (fallback || []).map(mapAnimation);
  } catch {
    return [];
  }
}

async function getHomepageConfig(): Promise<{ mosaic_animation_slots: number }> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_config")
      .single();
    if (data?.value?.mosaic_animation_slots != null) return data.value;
  } catch { /* ignore */ }
  return { mosaic_animation_slots: 6 };
}

const FEATURED_CATEGORY_SLUGS = [
  "christmas",
  "school",
  "book",
  "cat",
  "flower",
  "heart",
  "halloween",
  "thanksgiving",
  "pumpkin",
  "free",
];

const CATEGORY_USE_CASES: Record<string, string> = {
  christmas: "Holiday cards, classroom crafts, newsletters, and festive shop graphics.",
  school: "Worksheets, slides, bulletin boards, labels, and back-to-school projects.",
  book: "Library posters, reading logs, literacy worksheets, and story activities.",
  cat: "Pet flyers, stickers, social posts, classroom rewards, and cute merch ideas.",
  flower: "Invitations, spring projects, cards, packaging, and decorative layouts.",
  heart: "Valentine cards, wedding stationery, stickers, labels, and love notes.",
  halloween: "Party invites, classroom decor, flyers, and kid-friendly spooky projects.",
  thanksgiving: "Fall worksheets, menus, gratitude journals, cards, and seasonal marketing.",
  pumpkin: "Autumn crafts, Halloween designs, harvest graphics, and classroom activities.",
  free: "Start broad, browse the catalog, and find reusable clip art for any project.",
};

const QUALITY_FACTS = [
  {
    label: "Transparent PNG ready",
    title: "Drop it into designs",
    body: "Use clip art on slides, worksheets, cards, stickers, products, and websites without fighting a boxed background.",
  },
  {
    label: "Commercial use",
    title: "Built for real projects",
    body: "Create for classrooms, clients, shops, print-on-demand products, social posts, and marketing materials.",
  },
  {
    label: "Square clipart format",
    title: "Easy to reuse anywhere",
    body: "The standard 1:1 format works cleanly for icons, printable assets, product mockups, and digital layouts.",
  },
  {
    label: "Multiple styles",
    title: "Match your project",
    body: "Choose flat, cartoon, sticker, watercolor, vintage, kawaii, outline, and more when you create.",
  },
];

const USE_CASE_PATHS = [
  {
    title: "Teachers and classrooms",
    body: "Find visual aids for worksheets, slides, bulletin boards, lessons, labels, and seasonal activities.",
    href: "/school",
    link: "Browse school clip art",
  },
  {
    title: "Small business marketing",
    body: "Create friendly visuals for flyers, emails, menus, ads, packaging, and social media posts.",
    href: "/search?q=business",
    link: "Search business ideas",
  },
  {
    title: "Parties, crafts, and events",
    body: "Make invitations, cake toppers, stickers, gift tags, party signs, and printable decorations.",
    href: "/search?q=birthday",
    link: "Find party clip art",
  },
  {
    title: "Stickers and merchandise",
    body: "Generate clean isolated art for sticker sheets, t-shirts, mugs, planners, and product mockups.",
    href: "/search?style=sticker",
    link: "Explore sticker style",
  },
];

const PACK_BENEFITS = [
  "Matched assets for one theme",
  "Transparent PNG downloads",
  "Useful for classrooms, shops, and seasonal campaigns",
];

const PROMPT_EXAMPLES = [
  "birthday cake",
  "teacher apple",
  "soccer ball",
  "Christmas tree",
  "cute dog sticker",
  "watercolor flowers",
  "school bus",
  "pumpkin character",
];

const SECONDARY_PRODUCTS = [
  {
    title: "Coloring Pages",
    body: "Printable line art when you need kid-friendly pages instead of full-color clip art.",
    href: "/coloring-pages",
  },
  {
    title: "Worksheets",
    body: "Practice pages with clipart-style visuals for classroom and homeschool activities.",
    href: "/worksheets",
  },
  {
    title: "Illustrations",
    body: "Full-scene artwork when your project needs a background and more visual context.",
    href: "/illustrations",
  },
  {
    title: "Animations",
    body: "Bring selected clip art to life for presentations, social posts, and playful content.",
    href: "/animations",
  },
];

const FEATURED_STYLES: StyleKey[] = ["flat", "cartoon", "sticker", "watercolor", "vintage", "kawaii", "outline", "3d"];

function isCommunityImage(img: CommunityImage | SampleImage): img is CommunityImage {
  return "image_url" in img;
}

function normalizeHomeImage(img: CommunityImage | SampleImage): HomeVisual {
  if (isCommunityImage(img)) {
    return {
      key: img.id,
      title: img.title || img.prompt,
      slug: img.slug || img.id,
      category: img.category,
      url: img.image_url,
      transparentUrl: img.transparent_image_url,
      hasTransparency: img.has_transparency,
      style: img.style,
    };
  }

  return {
    key: img.slug,
    title: img.title,
    slug: img.slug,
    category: img.category || getCategorySlugForImage(img),
    url: img.url,
    transparentUrl: img.transparent_url,
    hasTransparency: img.has_transparency,
    style: img.tags?.[0],
  };
}

function takeVisuals(images: HomeVisual[], start: number, count: number): HomeVisual[] {
  if (images.length === 0) return [];
  return Array.from({ length: count }, (_, index) => images[(start + index) % images.length]);
}

function categoryVisuals(images: HomeVisual[], category: DbCategory, start: number): HomeVisual[] {
  const matches = images.filter((img) => img.category === category.slug);
  return (matches.length >= 3 ? matches : takeVisuals(images, start, 3)).slice(0, 3);
}

function imageHref(img: HomeVisual) {
  return `/${img.category}/${img.slug}`;
}

const faqItems = [
  {
    q: "Is clip.art really free?",
    a: "Yes. New users get free credits to create clip art, and every public catalog image can be browsed for inspiration. Generated images are free for personal and commercial use with no attribution required.",
  },
  {
    q: "What makes clip art different from illustrations?",
    a: "Clip art is usually an isolated object or character that is easy to place into a design. Illustrations are fuller scenes with backgrounds. The homepage focuses on clip art because it is the fastest asset to reuse in real projects.",
  },
  {
    q: "Can I use clip art for commercial projects?",
    a: "Yes. Use generated clip art in classroom materials, client work, small business marketing, print-on-demand products, stickers, cards, and other commercial projects without attribution.",
  },
  {
    q: "Do downloads have transparent backgrounds?",
    a: "Clip art is designed for clean reuse, and transparent PNG versions are supported where available. That makes it easier to layer assets onto worksheets, slides, cards, packaging, and web designs.",
  },
  {
    q: "How do I get better AI clip art results?",
    a: "Describe the subject, use case, and style in plain English. For example, try \"cute cartoon school bus for a classroom worksheet\" or \"watercolor flower bouquet for a wedding invitation.\"",
  },
  {
    q: "Do you still offer coloring pages, worksheets, illustrations, and animations?",
    a: "Yes. Those formats remain available through their dedicated pages and footer links. The homepage now prioritizes clip art because that is the core catalog and customer need.",
  },
];

export default async function Home() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/create");

  const [
    categories,
    clipArtImages,
    homepagePacks,
    mosaicAnimationItems,
    homepageConfig,
  ] = await Promise.all([
    getAllCategories(),
    getCommunityGallery(),
    getHomepagePacks(),
    getMosaicAnimations(),
    getHomepageConfig(),
  ]);

  const hasClipArt = clipArtImages.length > 0;
  const fallbackClipArt = sampleImages.slice(0, 32);
  const featuredClipArt = hasClipArt ? clipArtImages : fallbackClipArt;
  const visualImages = featuredClipArt.map(normalizeHomeImage);
  const heroVisuals = takeVisuals(visualImages, 0, 9);
  const qualityVisuals = takeVisuals(visualImages, 9, 8);
  const useCaseVisuals = takeVisuals(visualImages, 17, 12);
  const packVisuals = takeVisuals(visualImages, 6, 8);
  const promptVisuals = takeVisuals(visualImages, 12, 10);
  const featuredCategories = FEATURED_CATEGORY_SLUGS
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter(Boolean) as DbCategory[];
  const remainingCategories = categories.filter(
    (category) => !FEATURED_CATEGORY_SLUGS.includes(category.slug),
  );
  const categoryAtlas = [...featuredCategories, ...remainingCategories].slice(0, 12);
  const preferredWomanPack = homepagePacks.find((pack) =>
    pack.title.toLowerCase().includes("whimsical spring woman"),
  );
  const leadPack = preferredWomanPack || homepagePacks[0];

  const mosaicAnimations: MosaicAnimation[] = mosaicAnimationItems
    .slice(0, homepageConfig.mosaic_animation_slots)
    .map((a) => ({
      videoUrl: a.videoUrl,
      posterUrl: a.posterUrl,
    }));

  return (
    <main className="relative bg-[#0a0a0a]">
      <MosaicBackground animations={mosaicAnimations} />

      {/* ───── DARK ZONE: Hero + Generator ───── */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <Nav />
        <div className="flex flex-1 items-center justify-center px-3 py-4 pb-8 sm:px-4 sm:py-6 sm:pb-16">
          <div className="w-full max-w-xl">
            <div className="mb-4 text-center sm:mb-6">
              <div className="mb-3 flex justify-center sm:mb-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/[0.12] px-3 py-1.5 shadow-sm backdrop-blur-sm sm:px-4 sm:py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 sm:h-7 sm:w-7">
                    <svg className="h-3 w-3 text-black sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <div className="text-left leading-tight">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-100 sm:text-xs">
                      10 free credits
                    </p>
                    <p className="text-[10px] text-amber-200/80 sm:text-[11px]">Included when you sign up</p>
                  </div>
                </div>
              </div>
              <h1 className="font-futura-bold text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">Generate Clip Art</span>
                <span className="gradient-text">In Seconds.</span>
              </h1>
              <p className="mt-2 text-xs text-gray-300 sm:hidden">
                Describe it, generate, download.
              </p>
            </div>

            <div className="mb-5 hidden grid-cols-3 gap-3 sm:grid">
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-pink-400">Step 01</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Describe</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Step 02</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Generate</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-green-400">Step 03</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Download</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white p-3 shadow-[0_0_80px_rgba(255,138,101,0.15)] sm:rounded-3xl sm:p-8">
              <Suspense>
                <Generator />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* ───── TRANSITION ───── */}
      <div className="relative z-10">
        <div className="h-32 bg-gradient-to-b from-[#0a0a0a] to-white sm:h-40" />
      </div>

      {/* ───── CLIPART-FIRST ZONE ───── */}
      <div className="relative z-10 bg-white">
        <section className="pb-16 pt-8 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Clip Art Catalog</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
                  Browse clip art by what you need to make.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
                  Scan a visual catalog of classroom graphics, seasonal artwork, stickers, craft assets, icons, and everyday objects. The page should feel like a useful art shelf, not a list of links.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/search" className="btn-primary px-6 text-sm">
                    Browse Clip Art
                  </Link>
                  <Link href="/create" className="btn-secondary px-6 text-sm">
                    Generate Your Own
                  </Link>
                </div>
                <div className="mt-8 grid max-w-md grid-cols-3 gap-2">
                  {["Transparent PNG", "Commercial use", "Clipart first"].map((label) => (
                    <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-xs font-bold text-gray-600">
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-gray-100 bg-white p-3 shadow-2xl shadow-gray-200/70">
                <div className="grid grid-cols-4 gap-2">
                  {heroVisuals.map((img, index) => (
                    <Link
                      key={`${img.key}-${index}`}
                      href={imageHref(img)}
                      className={`group relative overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:ring-pink-200 ${
                        index === 0 ? "col-span-2 row-span-2" : ""
                      }`}
                    >
                      <div className={index === 0 ? "aspect-square" : "aspect-square"}>
                        <Image
                          src={img.transparentUrl || img.url}
                          alt={`${img.title} — free clip art`}
                          fill
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          sizes={index === 0 ? "(max-width: 1024px) 50vw, 300px" : "(max-width: 1024px) 25vw, 150px"}
                          unoptimized
                        />
                      </div>
                      {index === 0 && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/85 to-transparent p-3 pt-10">
                          <p className="line-clamp-1 text-sm font-black text-gray-950">{img.title}</p>
                          <p className="text-xs font-semibold text-pink-500">{img.category} clip art</p>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {categoryAtlas.length > 0 && (
              <div className="mt-14">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Popular categories</p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                      Start with what customers actually need.
                    </h3>
                  </div>
                  <Link href="/search" className="text-sm font-semibold text-pink-600 transition-colors hover:text-pink-700">
                    Explore all clip art &rarr;
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {categoryAtlas.map((category, index) => {
                    const visuals = categoryVisuals(visualImages, category, index * 2);
                    return (
                    <Link
                      key={category.slug}
                      href={`/${category.slug}`}
                      className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-100/60"
                    >
                      <div className="grid grid-cols-3 gap-1 bg-gray-50 p-2">
                        {visuals.map((img) => (
                          <div key={`${category.slug}-${img.key}`} className="relative aspect-square rounded-2xl bg-white">
                            <Image
                              src={img.transparentUrl || img.url}
                              alt={`${img.title} — ${category.name.toLowerCase()} clip art`}
                              fill
                              className="object-contain p-1.5"
                              sizes="90px"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                      <div className="p-5">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-pink-400">
                          {category.name}
                        </span>
                        <h4 className="mt-2 text-lg font-black text-gray-950">
                          {category.name} Clip Art
                        </h4>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">
                          {CATEGORY_USE_CASES[category.slug] || category.intro || `Browse and generate ${category.name.toLowerCase()} clip art for your next project.`}
                        </p>
                        <span className="mt-4 inline-flex text-sm font-semibold text-gray-400 transition-colors group-hover:text-pink-600">
                          Browse category &rarr;
                        </span>
                      </div>
                    </Link>
                  )})}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-gray-100 bg-gray-50/70 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">Quality facts</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  Reusable artwork should look ready before you download.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-500">
                  Show the product promise visually: isolated subjects, clean square formats, varied styles, and assets that can move from worksheets to shops to presentations without extra cleanup.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {QUALITY_FACTS.map((fact) => (
                    <div key={fact.title} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400">{fact.label}</p>
                      <h3 className="mt-2 text-base font-black text-gray-950">{fact.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">{fact.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-2xl shadow-gray-200/60">
                <div className="grid grid-cols-4 gap-2">
                  {qualityVisuals.map((img, index) => (
                    <Link
                      key={`${img.key}-quality-${index}`}
                      href={imageHref(img)}
                      className={`group relative overflow-hidden rounded-2xl bg-transparency-grid ring-1 ring-gray-100 transition hover:ring-orange-200 ${
                        index === 0 || index === 5 ? "col-span-2 row-span-2" : ""
                      }`}
                    >
                      <div className="aspect-square">
                        <Image
                          src={img.transparentUrl || img.url}
                          alt={`${img.title} reusable clip art`}
                          fill
                          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                          sizes={index === 0 || index === 5 ? "(max-width: 1024px) 50vw, 300px" : "(max-width: 1024px) 25vw, 150px"}
                          unoptimized
                        />
                      </div>
                      {(index === 0 || index === 5) && (
                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-gray-600 shadow-sm">
                          Transparent-ready
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Use cases</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  Start with the job, then choose the artwork.
                </h2>
              </div>
              <Link href="/search" className="text-sm font-semibold text-pink-600 hover:text-pink-700">
                Search the catalog &rarr;
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {USE_CASE_PATHS.map((item, index) => {
                const visuals = takeVisuals(useCaseVisuals, index * 3, 3);
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-xl hover:shadow-gray-200/70"
                  >
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3">
                      {visuals.map((img) => (
                        <div key={`${item.title}-${img.key}`} className="relative aspect-square rounded-2xl bg-white ring-1 ring-gray-100">
                          <Image
                            src={img.transparentUrl || img.url}
                            alt={`${img.title} for ${item.title.toLowerCase()}`}
                            fill
                            className="object-contain p-2"
                            sizes="120px"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                    <div className="p-7">
                      <h3 className="text-xl font-black text-gray-950">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.body}</p>
                      <span className="mt-5 inline-flex text-sm font-semibold text-pink-600">
                        {item.link} &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-[radial-gradient(circle_at_12%_18%,rgba(236,72,153,0.10),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(251,146,60,0.12),transparent_28%),#fff] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">Theme packs</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  Build with sets, not scattered singles.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
                  Packs make clip art easier to understand: one theme, multiple related assets, one download. This is where clip.art can feel more useful than a loose stock library.
                </p>
                <div className="mt-6 grid gap-2">
                  {PACK_BENEFITS.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      {benefit}
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/design-bundles" className="btn-primary px-6 text-sm">
                    Browse Theme Packs
                  </Link>
                  <Link href="/create/packs" className="btn-secondary px-6 text-sm">
                    Create a Pack
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/80 bg-white/85 p-3 shadow-2xl shadow-pink-100/70 ring-1 ring-gray-100 backdrop-blur">
                <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                  {leadPack?.cover_image_url ? (
                    <Link
                      href={`/design-bundles/${leadPack.categories?.slug || "all"}/${leadPack.slug}`}
                      className="group block overflow-hidden rounded-[1.6rem] bg-gray-100"
                    >
                      <div className="relative aspect-[4/5] bg-gray-100 sm:aspect-[4/3] lg:aspect-[4/5]">
                      <Image
                        src={leadPack.cover_image_url}
                        alt={`${leadPack.title} clipart theme pack preview`}
                        fill
                        className="object-cover object-[center_18%] transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 560px"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/88 via-gray-950/35 to-transparent p-5 pt-16">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-200">
                          Featured bundle
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-2xl font-black tracking-tight text-white">
                          {leadPack.title}
                        </h3>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-950">
                            {leadPack.item_count} assets
                          </span>
                          {leadPack.is_free && (
                            <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-emerald-950">
                              Free
                            </span>
                          )}
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20">
                            Transparent PNG
                          </span>
                        </div>
                      </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="rounded-[1.6rem] bg-gray-950 p-6 text-white">
                      <div className="grid grid-cols-3 gap-2">
                        {packVisuals.slice(0, 6).map((img) => (
                          <div key={`${img.key}-pack-fallback`} className="relative aspect-square rounded-2xl bg-white/10">
                            <Image src={img.transparentUrl || img.url} alt={`${img.title} clip art bundle example`} fill className="object-contain p-2" sizes="120px" unoptimized />
                          </div>
                        ))}
                      </div>
                      <h3 className="mt-5 text-2xl font-black tracking-tight">
                        Build a matching set of clip art.
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-400">
                        Browse curated bundles or create a pack for one theme, event, classroom unit, or shop collection.
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      {packVisuals.slice(0, 6).map((img) => (
                        <Link
                          key={`${img.key}-pack-mosaic`}
                          href={imageHref(img)}
                          className="relative aspect-square rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition hover:ring-pink-200"
                        >
                          <Image
                            src={img.transparentUrl || img.url}
                            alt={`${img.title} bundle asset example`}
                            fill
                            className="object-contain p-2"
                            sizes="140px"
                            unoptimized
                          />
                        </Link>
                      ))}
                    </div>
                    {homepagePacks.slice(1, 4).map((pack) => (
                      <Link
                        key={pack.id}
                        href={`/design-bundles/${pack.categories?.slug || "all"}/${pack.slug}`}
                        className="rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                          {pack.categories?.name || "Theme Pack"}
                        </p>
                        <h3 className="mt-1 line-clamp-2 font-black text-gray-950">{pack.title}</h3>
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {pack.item_count} coordinated assets
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-gray-50/70 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Prompt discovery</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  Search by subject, style, or use case.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-gray-500 sm:text-base">
                  Prompt chips are more useful when users can see examples next to them. Pair searches and styles with real artwork so discovery feels visual.
                </p>
                <div className="mt-6">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Try a search</p>
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_EXAMPLES.map((prompt) => (
                      <Link
                        key={prompt}
                        href={`/search?q=${encodeURIComponent(prompt)}`}
                        className="rounded-full border border-gray-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                      >
                        {prompt}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Browse by style</p>
                  <div className="flex flex-wrap gap-2">
                    {FEATURED_STYLES.filter((style) => VALID_STYLES.clipart.includes(style)).map((style) => (
                      <Link
                        key={style}
                        href={`/search?style=${style}`}
                        className="rounded-full border border-gray-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                      >
                        {STYLE_LABELS[style]}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-[2rem] border border-gray-100 bg-white p-3 shadow-2xl shadow-gray-200/60">
                <div className="grid grid-cols-5 gap-2">
                  {promptVisuals.map((img, index) => (
                    <Link
                      key={`${img.key}-prompt-${index}`}
                      href={imageHref(img)}
                      className={`group relative overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition hover:ring-pink-200 ${
                        index === 0 || index === 6 ? "col-span-2 row-span-2" : ""
                      }`}
                    >
                      <div className="aspect-square">
                        <Image
                          src={img.transparentUrl || img.url}
                          alt={`${img.title} prompt example`}
                          fill
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          sizes={index === 0 || index === 6 ? "(max-width: 1024px) 40vw, 260px" : "120px"}
                          unoptimized
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-[2rem] border border-gray-100 bg-gray-50/80 p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">Also available</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-950">
                    More ways to use your ideas.
                  </h2>
                </div>
                <Link href="/create" className="text-sm font-semibold text-pink-600 hover:text-pink-700">
                  Start creating &rarr;
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {SECONDARY_PRODUCTS.map((product) => (
                  <Link
                    key={product.title}
                    href={product.href}
                    className="rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg"
                  >
                    <div className="mb-4 flex gap-1.5">
                      {takeVisuals(visualImages, product.title.length, 3).map((img) => (
                        <div key={`${product.title}-${img.key}`} className="relative h-10 w-10 rounded-xl bg-gray-50 ring-1 ring-gray-100">
                          <Image
                            src={img.transparentUrl || img.url}
                            alt={`${img.title} example`}
                            fill
                            className="object-contain p-1"
                            sizes="40px"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                    <h3 className="font-black text-gray-950">{product.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{product.body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-gray-50/60 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-6 text-center text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
              Free AI clip art for classrooms, shops, crafts, and everyday design.
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              clip.art turns text descriptions into downloadable clip art that is easy to reuse in real projects. Browse categories like Christmas, school, books, flowers, hearts, cats, Halloween, and Thanksgiving, or search for the exact subject you need. Each piece is built around practical clip art use: isolated subjects, useful styles, and formats that work in documents, slides, printables, social posts, stickers, and product mockups.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
              The catalog is focused on clip art first because that is what customers reach for when they need a quick visual asset. You can still find coloring pages, worksheets, illustrations, and animations through their dedicated pages, but the homepage is designed to help you find, trust, and create clip art faster.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-10 text-center text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Frequently asked questions
            </h2>
            <div className="divide-y divide-gray-200 rounded-3xl border border-gray-200 bg-white shadow-sm">
              {faqItems.map((item, i) => (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left text-sm font-semibold text-gray-900 transition-colors hover:text-pink-600 sm:text-base [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <svg className="ml-4 h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-gray-500 sm:text-base">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="overflow-hidden rounded-[2rem] bg-gray-950 p-[1px] shadow-2xl shadow-gray-200">
              <div className="relative rounded-[calc(2rem-1px)] bg-white p-8 text-center sm:p-12">
                <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Create clip art</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  Need something specific? Generate it.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                  Start with 10 free credits. Describe the object, character, theme, or style you need and download reusable clip art for your next project.
                </p>
                <div className="mx-auto mt-7 grid max-w-xl grid-cols-6 gap-2">
                  {takeVisuals(visualImages, 22, 6).map((img) => (
                    <Link
                      key={`${img.key}-final`}
                      href={imageHref(img)}
                      className="relative aspect-square rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition hover:ring-pink-200"
                    >
                      <Image
                        src={img.transparentUrl || img.url}
                        alt={`${img.title} clip art example`}
                        fill
                        className="object-contain p-1.5"
                        sizes="80px"
                        unoptimized
                      />
                    </Link>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/create" className="btn-primary px-8 text-base">
                    Generate Clip Art
                  </Link>
                  <Link href="/search" className="btn-secondary px-8 text-base">
                    Browse the Catalog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </main>
  );
}
