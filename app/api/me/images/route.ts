import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ images: [], animations: [] }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const filter = searchParams.get("filter") || "all";
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "60", 10);

    const admin = createSupabaseAdmin();

    if (filter === "animations") {
      const { data } = await admin
        .from("animations")
        .select(
          "id, prompt, model, video_url, preview_url, thumbnail_url, created_at, " +
          "source:generations!animations_source_generation_id_fkey(image_url, title, slug, category)",
        )
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(limit);

      return NextResponse.json({ animations: data || [] });
    }

    let query = admin
      .from("generations")
      .select("id, image_url, title, prompt, slug, category, style, aspect_ratio, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === "coloring") {
      query = query.eq("style", "coloring");
    } else if (filter === "clipart") {
      query = query.neq("style", "coloring");
    }

    const { data } = await query;

    return NextResponse.json({ images: data || [] });
  } catch {
    return NextResponse.json({ images: [], animations: [] }, { status: 500 });
  }
}
