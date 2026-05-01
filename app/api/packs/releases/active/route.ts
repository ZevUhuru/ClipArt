import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("pack_release_notifications")
      .select("id, release_key, title, badge_label, description, target_path, pack_id, starts_at, ends_at")
      .eq("is_active", true)
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ release: null });
    }

    return NextResponse.json({ release: data || null });
  } catch {
    return NextResponse.json({ release: null });
  }
}

