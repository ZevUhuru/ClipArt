import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const MAX_RESULTS = 60;

type SortOption = "newest" | "featured" | "oldest";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const category = request.nextUrl.searchParams.get("category")?.trim();
  const style = request.nextUrl.searchParams.get("style")?.trim();
  const contentType = request.nextUrl.searchParams.get("content_type")?.trim() || "clipart";
  const sort = (request.nextUrl.searchParams.get("sort")?.trim() || "newest") as SortOption;
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || String(MAX_RESULTS), 10),
    MAX_RESULTS,
  );
  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0", 10);

  const browse = request.nextUrl.searchParams.get("browse") === "1";

  if (!q && !category && !style && !browse) {
    return NextResponse.json({ error: "Provide q, category, style, or browse=1" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdmin();

    if (contentType === "animations") {
      return handleAnimationsSearch(admin, { q, sort, limit, offset });
    }

    let query = admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, created_at, is_featured, featured_order", { count: "exact" })
      .eq("is_public", true);

    if (contentType === "coloring") {
      query = query.eq("content_type", "coloring");
    } else if (contentType === "illustration") {
      query = query.eq("content_type", "illustration");
    } else {
      query = query.eq("content_type", "clipart");
    }

    if (category) {
      const catPattern = `%${category.replace(/-/g, " ")}%`;
      query = query.or(
        `category.eq.${category},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
      );
    }

    if (style && contentType !== "coloring") {
      query = query.eq("style", style);
    }

    if (q) {
      const tsQuery = q
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `${w}:*`)
        .join(" & ");

      query = query.textSearch("search_vector", tsQuery);
    }

    if (sort === "featured") {
      query = query.order("is_featured", { ascending: false }).order("featured_order", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
    } else if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Search query error:", error);
      return NextResponse.json({ results: [], total: 0 });
    }

    const results = (data || []).map((row: Record<string, string>) => ({
      id: row.id,
      slug: row.id,
      title: row.title || row.prompt,
      url: row.image_url,
      description: row.prompt,
      category: row.category,
      style: row.style,
    }));

    return NextResponse.json({ results, total: count ?? results.length });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ results: [], total: 0 }, { status: 500 });
  }
}

async function handleAnimationsSearch(
  admin: ReturnType<typeof createSupabaseAdmin>,
  opts: { q?: string; sort: SortOption; limit: number; offset: number },
) {
  try {
    let query = admin
      .from("animations")
      .select(
        "id, prompt, video_url, preview_url, thumbnail_url, model, source_generation_id, created_at, " +
        "source:generations!animations_source_generation_id_fkey(image_url, title, category, slug)",
        { count: "exact" },
      )
      .eq("status", "completed")
      .eq("is_public", true);

    if (opts.q) {
      query = query.ilike("prompt", `%${opts.q}%`);
    }

    if (opts.sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(opts.offset, opts.offset + opts.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Animations search error:", error);
      return NextResponse.json({ results: [], total: 0 });
    }

    const results = (data || []).map((row: Record<string, unknown>) => {
      const source = row.source as Record<string, string> | null;
      return {
        id: row.id as string,
        slug: row.id as string,
        title: source?.title || (row.prompt as string),
        url: source?.image_url || (row.thumbnail_url as string) || "",
        description: row.prompt as string,
        category: source?.category || "free",
        style: "animation",
        videoUrl: row.video_url as string,
        previewUrl: row.preview_url as string,
        thumbnailUrl: row.thumbnail_url as string,
        model: row.model as string,
      };
    });

    return NextResponse.json({ results, total: count ?? results.length });
  } catch (err) {
    console.error("Animations search error:", err);
    return NextResponse.json({ results: [], total: 0 }, { status: 500 });
  }
}
