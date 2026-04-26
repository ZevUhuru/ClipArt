import { createSupabaseAdmin } from "@/lib/supabase/server";

export interface DbCategory {
  id: string;
  slug: string;
  name: string;
  h1: string;
  meta_title: string | null;
  meta_description: string | null;
  intro: string | null;
  seo_content: string[];
  suggested_prompts: string[];
  related_slugs: string[];
  image_count: number;
  is_active: boolean;
  sort_order: number;
}

export async function getAllCategories(): Promise<DbCategory[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .in("type", ["clipart"])
      .order("sort_order");
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<DbCategory | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    return (data as DbCategory) || null;
  } catch {
    return null;
  }
}

export async function getCategorySlugs(): Promise<string[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .in("type", ["clipart"])
      .order("sort_order");
    return (data || []).map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
}

export async function getColoringThemes(): Promise<DbCategory[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("type", "coloring")
      .order("sort_order");
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export async function getColoringThemeBySlug(slug: string): Promise<DbCategory | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("type", "coloring")
      .eq("is_active", true)
      .single();
    return (data as DbCategory) || null;
  } catch {
    return null;
  }
}

export async function getIllustrationCategories(): Promise<DbCategory[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("type", "illustration")
      .order("sort_order");
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export async function getIllustrationCategoryBySlug(slug: string): Promise<DbCategory | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("type", "illustration")
      .eq("is_active", true)
      .single();
    return (data as DbCategory) || null;
  } catch {
    return null;
  }
}

export async function getIllustrationCategorySlugs(): Promise<string[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .eq("type", "illustration")
      .order("sort_order");
    return (data || []).map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
}

export async function getColoringThemeSlugs(): Promise<string[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .eq("type", "coloring")
      .order("sort_order");
    return (data || []).map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Worksheets — 3-level hub taxonomy (grade / subject / topic)
// ---------------------------------------------------------------------------
// Category slugs encode the hierarchy with a `--` separator:
//   grade hub    → `1st-grade`
//   subject hub  → `1st-grade--math`
//   topic hub    → `1st-grade--math--addition`
// All rows have `type='worksheet'`.
//
// These helpers scope by slug prefix and level depth so the browse surfaces
// can render each level of the tree without second queries.

// Pure taxonomy constants/types live in `./worksheets-taxonomy` so client
// components can import them without pulling in the server-only supabase code.
// Re-exported here for backwards compat with existing server callers.
export {
  WORKSHEET_GRADES,
  WORKSHEET_SUBJECTS,
  type WorksheetGrade,
  type WorksheetSubject,
  isWorksheetGrade,
  isWorksheetSubject,
} from "./worksheets-taxonomy";
import {
  WORKSHEET_GRADES,
  isWorksheetGrade,
  isWorksheetSubject,
  subjectSlug,
  topicSlug,
} from "./worksheets-taxonomy";

export async function getWorksheetGrades(): Promise<DbCategory[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("type", "worksheet")
      .in("slug", WORKSHEET_GRADES as unknown as string[])
      .order("sort_order");
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export async function getWorksheetGradeBySlug(grade: string): Promise<DbCategory | null> {
  if (!isWorksheetGrade(grade)) return null;
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("slug", grade)
      .eq("type", "worksheet")
      .eq("is_active", true)
      .single();
    return (data as DbCategory) || null;
  } catch {
    return null;
  }
}

export async function getWorksheetSubjects(grade: string): Promise<DbCategory[]> {
  if (!isWorksheetGrade(grade)) return [];
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("type", "worksheet")
      .like("slug", `${grade}--%`)
      // Only direct children: exactly one separator after the grade prefix
      .not("slug", "like", `${grade}--%--%`)
      .order("sort_order");
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export async function getWorksheetSubjectBySlug(
  grade: string,
  subject: string,
): Promise<DbCategory | null> {
  if (!isWorksheetGrade(grade) || !isWorksheetSubject(subject)) return null;
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("slug", subjectSlug(grade, subject))
      .eq("type", "worksheet")
      .eq("is_active", true)
      .single();
    return (data as DbCategory) || null;
  } catch {
    return null;
  }
}

export async function getWorksheetTopics(
  grade: string,
  subject: string,
): Promise<DbCategory[]> {
  if (!isWorksheetGrade(grade) || !isWorksheetSubject(subject)) return [];
  try {
    const admin = createSupabaseAdmin();
    const prefix = `${subjectSlug(grade, subject)}--`;
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("type", "worksheet")
      .like("slug", `${prefix}%`)
      .order("sort_order");
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export async function getWorksheetTopicBySlug(
  grade: string,
  subject: string,
  topic: string,
): Promise<DbCategory | null> {
  if (!isWorksheetGrade(grade) || !isWorksheetSubject(subject)) return null;
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("slug", topicSlug(grade, subject, topic))
      .eq("type", "worksheet")
      .eq("is_active", true)
      .single();
    return (data as DbCategory) || null;
  } catch {
    return null;
  }
}

// Topic slug lookups for generateStaticParams (sitemap + static generation)
export async function getAllWorksheetTopicParams(): Promise<
  { grade: string; subject: string; topic: string }[]
> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .eq("type", "worksheet")
      .like("slug", "%--%--%");
    return (data || [])
      .map((r: { slug: string }): string[] => r.slug.split("--"))
      .filter((parts: string[]) => parts.length === 3)
      .map((parts: string[]) => ({
        grade: parts[0],
        subject: parts[1],
        topic: parts[2],
      }));
  } catch {
    return [];
  }
}
