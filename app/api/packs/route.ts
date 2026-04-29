import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("packs")
    .select("*, categories!category_id(slug, name)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packs: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    category_id,
    tags,
    visibility,
    audience,
    pack_goal,
    long_description,
    whats_included,
    use_cases,
    license_summary,
    is_free,
    price_cents,
    compare_at_price_cents,
    launch_price_cents,
    launch_ends_at,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const baseSlug = slugify(title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  const canSetPaid = profile?.is_admin === true;

  const { data, error } = await admin
    .from("packs")
    .insert({
      user_id: user.id,
      title: title.trim(),
      slug,
      description: description?.trim() || null,
      category_id: category_id || null,
      tags: tags || [],
      visibility: visibility === "public" ? "public" : "private",
      audience: audience?.trim() || null,
      pack_goal: pack_goal?.trim() || null,
      long_description: long_description?.trim() || null,
      whats_included: whats_included?.trim() || null,
      use_cases: use_cases?.trim() || null,
      license_summary: license_summary?.trim() || null,
      is_free: canSetPaid ? is_free !== false : true,
      price_cents: canSetPaid && is_free === false ? Number(price_cents) || null : null,
      compare_at_price_cents: canSetPaid ? Number(compare_at_price_cents) || null : null,
      launch_price_cents: canSetPaid ? Number(launch_price_cents) || null : null,
      launch_ends_at: canSetPaid ? launch_ends_at || null : null,
    })
    .select("*, categories!category_id(slug, name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pack: data }, { status: 201 });
}
