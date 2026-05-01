import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";

async function getAdminUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function targetPathForPack(pack: { slug: string; categories?: { slug: string } | null }) {
  return `/packs/${pack.categories?.slug || "all"}/${pack.slug}`;
}

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("pack_release_notifications")
      .select(`
        id, release_key, pack_id, title, badge_label, description, target_path,
        launch_mode, is_active, starts_at, ends_at, created_at, updated_at,
        packs(title, slug, cover_image_url, categories!category_id(slug, name))
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return NextResponse.json({ releases: [] });
    return NextResponse.json({ releases: data || [] });
  } catch {
    return NextResponse.json({ releases: [] });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const packId = String(body.pack_id || "");
  const launchMode = body.launch_mode === "auto" ? "auto" : "manual";
  const shouldActivate = body.is_active !== false;

  if (!packId) {
    return NextResponse.json({ error: "Pack is required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: pack, error: packError } = await admin
    .from("packs")
    .select("id, title, slug, cover_image_url, is_published, visibility, categories!category_id(slug, name)")
    .eq("id", packId)
    .single();

  if (packError || !pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const title = String(body.title || `${pack.title} is live`).trim();
  const badgeLabel = String(body.badge_label || "New drop").trim();
  const description = String(body.description || `New pack released: ${pack.title}`).trim();
  const releaseKey = String(body.release_key || `${slugify(pack.title)}-${Date.now().toString(36)}`).trim();
  const targetPath = String(body.target_path || targetPathForPack(pack)).trim();

  if (shouldActivate) {
    await admin
      .from("pack_release_notifications")
      .update({ is_active: false })
      .eq("is_active", true);
  }

  const { data, error } = await admin
    .from("pack_release_notifications")
    .insert({
      release_key: releaseKey,
      pack_id: pack.id,
      title,
      badge_label: badgeLabel,
      description,
      target_path: targetPath,
      launch_mode: launchMode,
      is_active: shouldActivate,
      starts_at: body.starts_at || new Date().toISOString(),
      ends_at: body.ends_at || null,
      created_by: user.id,
    })
    .select(`
      id, release_key, pack_id, title, badge_label, description, target_path,
      launch_mode, is_active, starts_at, ends_at, created_at, updated_at,
      packs(title, slug, cover_image_url, categories!category_id(slug, name))
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ release: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const releaseId = String(body.id || "");
  if (!releaseId) {
    return NextResponse.json({ error: "Release id is required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  if (body.is_active === true) {
    await admin
      .from("pack_release_notifications")
      .update({ is_active: false })
      .eq("is_active", true)
      .neq("id", releaseId);
  }

  const updates: Record<string, unknown> = {};
  for (const field of ["title", "badge_label", "description", "target_path", "launch_mode", "is_active", "starts_at", "ends_at"]) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await admin
    .from("pack_release_notifications")
    .update(updates)
    .eq("id", releaseId)
    .select(`
      id, release_key, pack_id, title, badge_label, description, target_path,
      launch_mode, is_active, starts_at, ends_at, created_at, updated_at,
      packs(title, slug, cover_image_url, categories!category_id(slug, name))
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ release: data });
}

