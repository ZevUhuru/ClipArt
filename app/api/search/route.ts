import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const MAX_RESULTS = 60;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const category = request.nextUrl.searchParams.get("category")?.trim();
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || String(MAX_RESULTS), 10),
    MAX_RESULTS,
  );
  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0", 10);

  if (!q && !category) {
    return NextResponse.json({ error: "Provide q or category" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdmin();

    let query = admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    if (q) {
      const tsQuery = q
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `${w}:*`)
        .join(" & ");

      query = query.textSearch("search_vector", tsQuery);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Search query error:", error);
      return NextResponse.json({ results: [] });
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

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ results: [], total: 0 }, { status: 500 });
  }
}
