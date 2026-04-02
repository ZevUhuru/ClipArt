import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createSupabaseAdmin();

    const [genResult, animResult] = await Promise.all([
      admin
        .from("generations")
        .select("id, image_url, prompt, style, category, slug, aspect_ratio, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("animations")
        .select(
          "id, prompt, video_url, preview_url, thumbnail_url, model, created_at, " +
            "source:generations!animations_source_generation_id_fkey(id, image_url, prompt, style, category, slug, aspect_ratio)",
        )
        .eq("status", "completed")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    return NextResponse.json(
      { generations: genResult.data || [], animations: animResult.data || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json({ generations: [], animations: [] }, { status: 500 });
  }
}
