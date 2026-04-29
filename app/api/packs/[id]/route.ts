import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("packs")
    .select(`
      *,
      categories!category_id(slug, name),
      pack_items(
        id, generation_id, is_exclusive, sort_order, created_at,
        generations(id, title, slug, prompt, image_url, transparent_image_url, has_transparency, style, content_type, category)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (data.user_id !== user.id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const items = (data.pack_items || []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
  );

  return NextResponse.json({ pack: { ...data, pack_items: items } });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("packs")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  const canSetPaid = profile?.is_admin === true;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.category_id !== undefined) updates.category_id = body.category_id || null;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.visibility !== undefined) updates.visibility = body.visibility === "public" ? "public" : "private";
  if (body.audience !== undefined) updates.audience = body.audience?.trim() || null;
  if (body.pack_goal !== undefined) updates.pack_goal = body.pack_goal?.trim() || null;
  if (body.long_description !== undefined) updates.long_description = body.long_description?.trim() || null;
  if (body.whats_included !== undefined) updates.whats_included = body.whats_included?.trim() || null;
  if (body.use_cases !== undefined) updates.use_cases = body.use_cases?.trim() || null;
  if (body.license_summary !== undefined) updates.license_summary = body.license_summary?.trim() || null;
  if (canSetPaid) {
    if (body.is_free !== undefined) updates.is_free = body.is_free !== false;
    if (body.price_cents !== undefined) updates.price_cents = Number(body.price_cents) || null;
    if (body.compare_at_price_cents !== undefined) {
      updates.compare_at_price_cents = Number(body.compare_at_price_cents) || null;
    }
    if (body.launch_price_cents !== undefined) {
      updates.launch_price_cents = Number(body.launch_price_cents) || null;
    }
    if (body.launch_ends_at !== undefined) updates.launch_ends_at = body.launch_ends_at || null;
  }
  if (body.cover_image_url !== undefined) updates.cover_image_url = body.cover_image_url;

  if (body.cover_generation_id !== undefined) {
    if (body.cover_generation_id === null || body.cover_generation_id === "") {
      updates.cover_generation_id = null;
    } else {
      const { data: coverItem } = await admin
        .from("pack_items")
        .select("generation_id, generations(image_url, transparent_image_url)")
        .eq("pack_id", id)
        .eq("generation_id", body.cover_generation_id)
        .single();

      if (!coverItem) {
        return NextResponse.json({ error: "Cover image must be in this pack" }, { status: 400 });
      }

      const generation = Array.isArray(coverItem.generations)
        ? coverItem.generations[0]
        : coverItem.generations;

      updates.cover_generation_id = body.cover_generation_id;
      updates.cover_image_url = generation?.transparent_image_url || generation?.image_url || null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("packs")
    .update(updates)
    .eq("id", id)
    .select("*, categories!category_id(slug, name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pack: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("packs")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("packs").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
