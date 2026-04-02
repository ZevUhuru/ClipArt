import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const sort = searchParams.get("sort") || "popular";
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 50);

    const admin = createSupabaseAdmin();

    let query = admin
      .from("animation_prompts")
      .select(
        "id, title, prompt, use_count, is_ai_generated, created_at, " +
        "source:generations!animation_prompts_generation_id_fkey(id, image_url, title, slug, category)",
      )
      .eq("is_public", true);

    if (sort === "popular") {
      query = query.order("use_count", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "recent") {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("[prompts] Query error:", error);
      return NextResponse.json({ prompts: [], total: 0 }, { status: 500 });
    }

    const { count } = await admin
      .from("animation_prompts")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true);

    return NextResponse.json({
      prompts: data || [],
      total: count || 0,
      offset,
      limit,
    });
  } catch (err) {
    console.error("[prompts]", err);
    return NextResponse.json({ prompts: [], total: 0 }, { status: 500 });
  }
}
