import type { Metadata } from "next";
import Link from "next/link";
import { getWorksheetGrades } from "@/lib/categories";
import { CategoryNav } from "@/components/CategoryNav";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildBreadcrumbJsonLd } from "@/lib/seo-jsonld";
import { DEFAULT_SOCIAL_IMAGE, SITE_URL } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Free Printable Worksheets for Kids — AI Worksheet Generator",
  description:
    "Free printable worksheets for preschool through 5th grade. Math, reading, writing, phonics, science, and spelling worksheets with cute illustrations. Create your own with AI.",
  openGraph: {
    title: "Free Printable Worksheets for Kids — AI Worksheet Generator",
    description:
      "Free printable worksheets for preschool through 5th grade. Math, reading, writing, phonics, science, and spelling worksheets. Create your own with AI.",
    url: `${SITE_URL}/worksheets`,
    siteName: "clip.art",
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Printable Worksheets for Kids — AI Worksheet Generator",
    description:
      "Free printable worksheets for preschool through 5th grade. Create your own with AI.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  alternates: {
    canonical: `${SITE_URL}/worksheets`,
  },
};

interface FeaturedImage {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  style: string;
  category: string;
  slug: string | null;
  aspect_ratio: string;
  grade: string | null;
  subject: string | null;
  topic: string | null;
  created_at: string;
}

async function getFeaturedWorksheets(): Promise<FeaturedImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select(
        "id, prompt, title, image_url, style, category, slug, aspect_ratio, grade, subject, topic, created_at",
      )
      .eq("content_type", "worksheet")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(12);
    return (data || []) as FeaturedImage[];
  } catch {
    return [];
  }
}

export default async function WorksheetsLanding() {
  const [grades, featured] = await Promise.all([
    getWorksheetGrades(),
    getFeaturedWorksheets(),
  ]);

  const jsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: SITE_URL },
    { name: "Worksheets", path: "worksheets" },
  ]);

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          Free AI <span className="gradient-text">Worksheets</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
          Printable worksheets for preschool through 5th grade. Math, reading,
          writing, phonics, science, and spelling — all with cute,
          kid-friendly illustrations. Free to download and print.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/create/worksheets" className="btn-primary text-base">
            Create a Worksheet
          </Link>
        </div>
      </section>

      {/* Grade Grid */}
      {grades.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Browse by grade
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {grades.map((grade) => (
              <Link
                key={grade.slug}
                href={`/worksheets/${grade.slug}`}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center shadow-sm transition-all hover:border-pink-200 hover:bg-pink-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-700 group-hover:text-pink-700">
                  {grade.name}
                </p>
                <p className="mt-1 text-xs text-gray-400">Worksheets</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Gallery */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Recently created worksheets
          </h2>
          <ImageGrid variant="coloring">
            {featured.map((img) => {
              const href =
                img.grade && img.subject && img.topic
                  ? `/worksheets/${img.grade}/${img.subject}/${img.topic}/${img.slug || img.id}`
                  : `/worksheets`;
              return (
                <ImageCard
                  key={img.id}
                  image={{
                    slug: img.slug || img.id,
                    title: img.title || img.prompt,
                    url: img.image_url,
                    category: img.category,
                    style: "cartoon",
                    aspect_ratio: img.aspect_ratio || "3:4",
                  }}
                  variant="coloring"
                  href={href}
                />
              );
            })}
          </ImageGrid>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create your own worksheets
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Pick a grade, subject and topic, describe the activity, and our
              AI generates a printable worksheet in seconds. 10 free credits
              when you sign up.
            </p>
            <div className="mt-8">
              <Link href="/create/worksheets" className="btn-primary px-8 text-base">
                Start Creating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
          clip.art&apos;s AI worksheet generator creates unique, printable
          educational worksheets for kids from preschool through 5th grade.
          Whether you need addition practice for 1st grade, letter tracing for
          kindergarten, or reading comprehension for 3rd grade, our generator
          delivers beautifully illustrated worksheets with diverse, kid-safe
          characters and clear instructions.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          All worksheets are free to download and print for personal,
          classroom, or homeschool use. Teachers, parents, and tutors can
          generate unlimited custom worksheets on any topic &mdash; math,
          reading, writing, phonics, science, spelling, seasons, animals,
          dinosaurs, and more.
        </p>
      </section>

      <MarketingFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
