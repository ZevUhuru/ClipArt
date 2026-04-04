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
