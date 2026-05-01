import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getFeaturedPackRelease() {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("packs")
    .select("id, title, slug, categories!category_id(slug, name)")
    .eq("is_published", true)
    .eq("visibility", "public")
    .eq("is_featured", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: `featured-${data.id}`,
    release_key: `featured-${data.id}`,
    title: `${data.title} is featured`,
    badge_label: "New drop",
    description: `Featured pack drop: ${data.title}`,
    target_path: `/packs/${data.categories?.slug || "all"}/${data.slug}`,
    pack_id: data.id,
    starts_at: null,
    ends_at: null,
  };
}

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
      return NextResponse.json({ release: await getFeaturedPackRelease() });
    }

    return NextResponse.json({ release: data || await getFeaturedPackRelease() });
  } catch {
    try {
      return NextResponse.json({ release: await getFeaturedPackRelease() });
    } catch {
      return NextResponse.json({ release: null });
    }
  }
}

