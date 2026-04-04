import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("social_uploads")
    .select(
      "id, provider, platform_video_id, platform_url, title, status, error_message, created_at, " +
        "animation:animations!social_uploads_animation_id_fkey(id, video_url, thumbnail_url, prompt, " +
        "source:generations!animations_source_generation_id_fkey(image_url, title))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Social uploads fetch error:", error);
    return NextResponse.json({ uploads: [] });
  }

  return NextResponse.json({ uploads: data || [] });
}
