import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return !!profile?.is_admin;
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const admin = createSupabaseAdmin();

  const { data, error } = await admin
    .from("animations")
    .select(
      "id, prompt, model, status, video_url, preview_url, thumbnail_url, " +
      "is_featured, is_mosaic, is_gallery, is_public, created_at, " +
      "source:generations!animations_source_generation_id_fkey(id, image_url, title, slug)",
    )
    .eq("status", "completed")
    .order("is_gallery", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("is_mosaic", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await admin
    .from("animations")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  return NextResponse.json({
    animations: data || [],
    total: count || 0,
    offset,
    limit,
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, boolean> = {};
  if (typeof body.is_featured === "boolean") updates.is_featured = body.is_featured;
  if (typeof body.is_mosaic === "boolean") updates.is_mosaic = body.is_mosaic;
  if (typeof body.is_gallery === "boolean") updates.is_gallery = body.is_gallery;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("animations")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
