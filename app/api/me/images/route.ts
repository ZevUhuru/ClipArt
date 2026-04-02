import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ images: [] }, { status: 401 });
    }

    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("id, image_url, title, slug, category, style, aspect_ratio")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);

    return NextResponse.json({ images: data || [] });
  } catch {
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
