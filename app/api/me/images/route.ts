import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SortOption = "newest" | "oldest";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ images: [], animations: [] }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const filter = searchParams.get("filter") || "all";
    const q = searchParams.get("q")?.trim();
    const style = searchParams.get("style")?.trim();
    const sort = (searchParams.get("sort")?.trim() || "newest") as SortOption;
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "60", 10);

    const admin = createSupabaseAdmin();
    const ascending = sort === "oldest";

    if (filter === "animations") {
      let animQuery = admin
        .from("animations")
        .select(
          "id, slug, prompt, model, video_url, preview_url, thumbnail_url, created_at, " +
          "source:generations!animations_source_generation_id_fkey(image_url, title, slug, category, aspect_ratio)",
          { count: "exact" },
        )
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending })
        .range(offset, offset + limit - 1);

      if (q) {
        animQuery = animQuery.ilike("prompt", `%${q}%`);
      }

      const { data, count } = await animQuery;

      return NextResponse.json({ animations: data || [], total: count ?? (data || []).length });
    }

    let query = admin
      .from("generations")
      .select("id, image_url, title, prompt, slug, category, style, content_type, aspect_ratio, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending })
      .range(offset, offset + limit - 1);

    if (filter === "coloring") {
      query = query.eq("content_type", "coloring");
    } else if (filter === "clipart") {
      query = query.eq("content_type", "clipart");
    } else if (filter === "illustrations") {
      query = query.eq("content_type", "illustration");
    }

    if (style) {
      query = query.eq("style", style);
    }

    if (q) {
      query = query.or(`prompt.ilike.%${q}%,title.ilike.%${q}%`);
    }

    const { data, count } = await query;

    return NextResponse.json({ images: data || [], total: count ?? (data || []).length });
  } catch {
    return NextResponse.json({ images: [], animations: [], total: 0 }, { status: 500 });
  }
}
