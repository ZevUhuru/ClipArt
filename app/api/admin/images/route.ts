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
  const isPublic = searchParams.get("is_public");
  const isFeatured = searchParams.get("is_featured");
  const userId = searchParams.get("user_id")?.trim();
  const offset = (page - 1) * limit;

  const admin = createSupabaseAdmin();

  let query = admin
    .from("generations")
    .select(
      "id, prompt, title, slug, description, image_url, style, content_type, category, is_public, is_featured, featured_order, model, user_id, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (isPublic === "true") query = query.eq("is_public", true);
  if (isPublic === "false") query = query.eq("is_public", false);
  if (isFeatured === "true") query = query.eq("is_featured", true);
  if (isFeatured === "false") query = query.eq("is_featured", false);
  if (userId) query = query.eq("user_id", userId);
  if (search) query = query.or(`title.ilike.%${search}%,prompt.ilike.%${search}%`);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fan out one extra query to map user_id -> email so the admin UI can show
  // who generated each image without doing it client-side.
  type GenerationRow = {
    id: string;
    user_id: string | null;
    [key: string]: unknown;
  };
  const rows = (data || []) as GenerationRow[];
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((v): v is string => !!v)),
  );

  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const p of profiles || []) {
      if (p?.id && p?.email) emailMap.set(p.id as string, p.email as string);
    }
  }

  // Optionally surface the filtered user's email separately so the UI can
  // show "Filtering by foo@bar.com" without an extra round-trip.
  let filteredUserEmail: string | null = null;
  if (userId) {
    if (emailMap.has(userId)) {
      filteredUserEmail = emailMap.get(userId)!;
    } else {
      const { data: p } = await admin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle();
      filteredUserEmail = (p?.email as string | undefined) || null;
    }
  }

  const images = rows.map((r) => ({
    ...r,
    user_email: r.user_id ? emailMap.get(r.user_id) ?? null : null,
  }));

  return NextResponse.json({
    images,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    filteredUserEmail,
  });
}
