import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getWorksheetGradeBySlug,
  getWorksheetSubjectBySlug,
  getWorksheetTopicBySlug,
  isWorksheetGrade,
  isWorksheetSubject,
} from "@/lib/categories";
import { WorksheetHubPage } from "@/components/WorksheetHubPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildListingMetadata, SITE_URL } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo-jsonld";

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: { grade: string; subject: string; topic: string };
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!isWorksheetGrade(params.grade) || !isWorksheetSubject(params.subject)) {
    return {};
  }
  const topic = await getWorksheetTopicBySlug(
    params.grade,
    params.subject,
    params.topic,
  );
  if (!topic) return {};

  return buildListingMetadata({
    title: topic.meta_title,
    description: topic.meta_description,
    categoryName: topic.name,
    contentType: "worksheet",
    path: `worksheets/${params.grade}/${params.subject}/${params.topic}`,
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

async function getGalleryImages(
  grade: string,
  subject: string,
  topic: string,
) {
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
      .eq("subject", subject)
      .eq("topic", topic)
      .order("created_at", { ascending: false })
      .limit(60);

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
  if (!isWorksheetGrade(params.grade) || !isWorksheetSubject(params.subject)) {
    notFound();
  }

  const [grade, subject, topic, galleryImages] = await Promise.all([
    getWorksheetGradeBySlug(params.grade),
    getWorksheetSubjectBySlug(params.grade, params.subject),
    getWorksheetTopicBySlug(params.grade, params.subject, params.topic),
    getGalleryImages(params.grade, params.subject, params.topic),
  ]);

  if (!grade || !subject || !topic) notFound();

  const subjectName = subject.name.replace(
    new RegExp(`^${grade.name}\\s+`, "i"),
    "",
  );

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Worksheets", href: "/worksheets" },
    { label: grade.name, href: `/worksheets/${params.grade}` },
    {
      label: subjectName,
      href: `/worksheets/${params.grade}/${params.subject}`,
    },
    { label: topic.name },
  ];

  const jsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: SITE_URL },
    { name: "Worksheets", path: "worksheets" },
    { name: grade.name, path: `worksheets/${params.grade}` },
    { name: subject.name, path: `worksheets/${params.grade}/${params.subject}` },
    {
      name: topic.name,
      path: `worksheets/${params.grade}/${params.subject}/${params.topic}`,
    },
  ]);

  return (
    <>
      <WorksheetHubPage
        category={topic}
        breadcrumbs={breadcrumbs}
        galleryImages={galleryImages}
        ctaHref="/create/worksheets"
        ctaLabel="Create a Worksheet"
        jsonLd={jsonLd}
      />
      <MarketingFooter />
    </>
  );
}
