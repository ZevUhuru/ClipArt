import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getWorksheetGradeBySlug,
  getWorksheetSubjectBySlug,
  getWorksheetTopicBySlug,
  isWorksheetGrade,
  isWorksheetSubject,
} from "@/lib/categories";
import { WorksheetDetailPage } from "@/components/WorksheetDetailPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildPageMetadata, SITE_URL } from "@/lib/seo";
import { buildImageJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo-jsonld";

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: { grade: string; subject: string; topic: string; slug: string };
}

export function generateStaticParams() {
  return [];
}

interface DbWorksheetRow {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  category: string;
  slug: string | null;
  description: string | null;
  aspect_ratio: string;
  grade: string | null;
  subject: string | null;
  topic: string | null;
  created_at: string;
}

async function getDbWorksheet(slug: string): Promise<DbWorksheetRow | null> {
  try {
    const admin = createSupabaseAdmin();

    const { data: bySlug } = await admin
      .from("generations")
      .select(
        "id, prompt, title, image_url, category, slug, description, aspect_ratio, grade, subject, topic, created_at",
      )
      .eq("slug", slug)
      .eq("content_type", "worksheet")
      .eq("is_public", true)
      .single();

    if (bySlug) return bySlug as DbWorksheetRow;

    const { data: byId } = await admin
      .from("generations")
      .select(
        "id, prompt, title, image_url, category, slug, description, aspect_ratio, grade, subject, topic, created_at",
      )
      .eq("id", slug)
      .eq("content_type", "worksheet")
      .eq("is_public", true)
      .single();

    return (byId as DbWorksheetRow) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const row = await getDbWorksheet(params.slug);
  if (!row) return {};

  const canonicalSlug = row.slug || row.id;
  const canonicalGrade = row.grade || params.grade;
  const canonicalSubject = row.subject || params.subject;
  const canonicalTopic = row.topic || params.topic;

  const topic = await getWorksheetTopicBySlug(
    canonicalGrade,
    canonicalSubject,
    canonicalTopic,
  );
  const topicName = topic?.name || canonicalTopic;
  const imageTitle = row.title || row.prompt;
  const imageDesc = row.description || row.prompt;

  return buildPageMetadata({
    subject: imageTitle,
    description: imageDesc,
    contentType: "worksheet",
    categoryName: topicName,
    path: `worksheets/${canonicalGrade}/${canonicalSubject}/${canonicalTopic}/${canonicalSlug}`,
    image: { url: row.image_url, alt: imageTitle },
  });
}

async function getRelatedWorksheets(
  grade: string,
  subject: string,
  topic: string,
  excludeSlug: string,
) {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("title, slug, image_url, aspect_ratio, grade, subject, topic")
      .eq("content_type", "worksheet")
      .eq("is_public", true)
      .eq("grade", grade)
      .eq("subject", subject)
      .eq("topic", topic)
      .neq("slug", excludeSlug)
      .order("created_at", { ascending: false })
      .limit(8);

    return (data || []).map(
      (r: {
        title: string;
        slug: string;
        image_url: string;
        aspect_ratio: string;
        grade: string;
        subject: string;
        topic: string;
      }) => ({
        title: r.title || "Worksheet",
        slug: r.slug,
        grade: r.grade,
        subject: r.subject,
        topic: r.topic,
        url: r.image_url,
        aspect_ratio: r.aspect_ratio || "3:4",
      }),
    );
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const row = await getDbWorksheet(params.slug);
  if (!row) notFound();
  if (!row.grade || !row.subject || !row.topic) notFound();

  const canonicalSlug = row.slug || row.id;
  const canonicalGrade = row.grade;
  const canonicalSubject = row.subject;
  const canonicalTopic = row.topic;

  if (
    params.grade !== canonicalGrade ||
    params.subject !== canonicalSubject ||
    params.topic !== canonicalTopic ||
    params.slug !== canonicalSlug
  ) {
    permanentRedirect(
      `/worksheets/${canonicalGrade}/${canonicalSubject}/${canonicalTopic}/${canonicalSlug}`,
    );
  }

  if (
    !isWorksheetGrade(canonicalGrade) ||
    !isWorksheetSubject(canonicalSubject)
  ) {
    notFound();
  }

  const [grade, subject, topic, relatedImages] = await Promise.all([
    getWorksheetGradeBySlug(canonicalGrade),
    getWorksheetSubjectBySlug(canonicalGrade, canonicalSubject),
    getWorksheetTopicBySlug(canonicalGrade, canonicalSubject, canonicalTopic),
    getRelatedWorksheets(
      canonicalGrade,
      canonicalSubject,
      canonicalTopic,
      canonicalSlug,
    ),
  ]);

  const gradeLabel = grade?.name || canonicalGrade;
  const subjectLabel =
    subject?.name.replace(new RegExp(`^${grade?.name || ""}\\s+`, "i"), "") ||
    canonicalSubject;
  const topicLabel = topic?.name || canonicalTopic;

  const imageTitle = row.title || row.prompt;
  const imageDesc = row.description || row.prompt;
  const tags = [
    "worksheet",
    canonicalGrade,
    canonicalSubject,
    canonicalTopic,
  ].filter(Boolean) as string[];

  const imageJsonLd = buildImageJsonLd({
    title: imageTitle,
    description: imageDesc,
    imageUrl: row.image_url,
    tags,
    datePublished: row.created_at,
    width: 1024,
    height: 1365,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: SITE_URL },
    { name: "Worksheets", path: "worksheets" },
    { name: gradeLabel, path: `worksheets/${canonicalGrade}` },
    {
      name: subject?.name || canonicalSubject,
      path: `worksheets/${canonicalGrade}/${canonicalSubject}`,
    },
    {
      name: topicLabel,
      path: `worksheets/${canonicalGrade}/${canonicalSubject}/${canonicalTopic}`,
    },
    {
      name: imageTitle,
      path: `worksheets/${canonicalGrade}/${canonicalSubject}/${canonicalTopic}/${canonicalSlug}`,
    },
  ]);

  return (
    <>
      <WorksheetDetailPage
        image={{
          title: imageTitle,
          slug: canonicalSlug,
          url: row.image_url,
          description: imageDesc,
          prompt: row.prompt,
          tags,
          aspect_ratio: row.aspect_ratio || "3:4",
          grade: canonicalGrade,
          subject: canonicalSubject,
          topic: canonicalTopic,
          created_at: row.created_at,
        }}
        gradeLabel={gradeLabel}
        subjectLabel={subjectLabel}
        topicLabel={topicLabel}
        relatedImages={relatedImages}
        topicSeoContent={topic?.seo_content || []}
        jsonLd={[imageJsonLd, breadcrumbJsonLd]}
        imageId={row.id}
      />
      <MarketingFooter />
    </>
  );
}
