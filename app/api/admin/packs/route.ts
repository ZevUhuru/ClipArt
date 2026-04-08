import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

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

  return profile?.is_admin === true;
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const search = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const visibility = searchParams.get("visibility")?.trim();
  const isFeatured = searchParams.get("is_featured");
  const isFree = searchParams.get("is_free");
  const offset = (page - 1) * limit;

  const admin = createSupabaseAdmin();

  let query = admin
    .from("packs")
    .select(
      "id, title, slug, description, cover_image_url, item_count, visibility, is_free, price_cents, is_published, is_featured, downloads, zip_status, user_id, created_at, updated_at, categories!category_id(slug, name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category_id", category);
  if (visibility) query = query.eq("visibility", visibility);
  if (isFeatured === "true") query = query.eq("is_featured", true);
  if (isFeatured === "false") query = query.eq("is_featured", false);
  if (isFree === "true") query = query.eq("is_free", true);
  if (isFree === "false") query = query.eq("is_free", false);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    packs: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
