import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getWorksheetGradeBySlug,
  getWorksheetGrades,
  getWorksheetSubjects,
} from "@/lib/categories";
import { WorksheetHubPage } from "@/components/WorksheetHubPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildListingMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo-jsonld";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

interface PageProps {
  params: { grade: string };
}

export async function generateStaticParams() {
  const grades = await getWorksheetGrades();
  return grades.map((g) => ({ grade: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const grade = await getWorksheetGradeBySlug(params.grade);
  if (!grade) return {};

  return buildListingMetadata({
    title: grade.meta_title,
    description: grade.meta_description,
    categoryName: grade.name,
    contentType: "worksheet",
    path: `worksheets/${grade.slug}`,
  });
}

interface GalleryRow {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  category: string;
  slug: string | null;
  aspect_ratio: string;
  grade: string;
  subject: string;
  topic: string;
}

async function getGalleryImages(grade: string) {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select(
        "id, prompt, title, image_url, category, slug, aspect_ratio, grade, subject, topic",
      )
      .eq("content_type", "worksheet")
      .eq("is_public", true)
      .eq("grade", grade)
      .order("created_at", { ascending: false })
      .limit(48);

    return (data || []).map((row: GalleryRow) => ({
      slug: row.slug || row.id,
      title: row.title || row.prompt,
      url: row.image_url,
      category: row.category,
      grade: row.grade,
      subject: row.subject,
      topic: row.topic,
      aspect_ratio: row.aspect_ratio || "3:4",
    }));
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const grade = await getWorksheetGradeBySlug(params.grade);
  if (!grade) notFound();

  const [subjects, galleryImages] = await Promise.all([
    getWorksheetSubjects(params.grade),
    getGalleryImages(params.grade),
  ]);

  const subjectTiles = subjects.map((s) => ({
    href: `/worksheets/${params.grade}/${s.slug.split("--")[1]}`,
    title: s.name.replace(new RegExp(`^${grade.name}\\s+`, "i"), ""),
    subtitle: "Worksheets",
  }));

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Worksheets", href: "/worksheets" },
    { label: grade.name },
  ];

  const jsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: SITE_URL },
    { name: "Worksheets", path: "worksheets" },
    { name: grade.name, path: `worksheets/${grade.slug}` },
  ]);

  return (
    <>
      <WorksheetHubPage
        category={grade}
        breadcrumbs={breadcrumbs}
        childTilesLabel="Browse by subject"
        childTiles={subjectTiles}
        galleryImages={galleryImages}
        ctaHref="/create/worksheets"
        ctaLabel="Create a Worksheet"
        jsonLd={jsonLd}
      />
      <MarketingFooter />
    </>
  );
}
