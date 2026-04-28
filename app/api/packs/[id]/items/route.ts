import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyPackOwner(packId: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdmin();
  const { data: pack } = await admin
    .from("packs")
    .select("user_id")
    .eq("id", packId)
    .single();

  if (!pack || pack.user_id !== user.id) return null;
  return { user, admin };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await verifyPackOwner(id);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { generation_ids, is_exclusive } = body;

  if (!Array.isArray(generation_ids) || generation_ids.length === 0) {
    return NextResponse.json({ error: "generation_ids array is required" }, { status: 400 });
  }

  const { data: maxOrder } = await auth.admin
    .from("pack_items")
    .select("sort_order")
    .eq("pack_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  let nextOrder = (maxOrder?.sort_order ?? -1) + 1;

  const rows = generation_ids.map((gid: string) => ({
    pack_id: id,
    generation_id: gid,
    is_exclusive: is_exclusive ?? false,
    sort_order: nextOrder++,
  }));

  const { data, error } = await auth.admin
    .from("pack_items")
    .upsert(rows, { onConflict: "pack_id,generation_id", ignoreDuplicates: true })
    .select(`
      id, generation_id, is_exclusive, sort_order, created_at,
      generations(id, title, slug, prompt, image_url, transparent_image_url, has_transparency, style, content_type, category)
    `);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await verifyPackOwner(id);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { item_ids } = body;

  if (!Array.isArray(item_ids) || item_ids.length === 0) {
    return NextResponse.json({ error: "item_ids array is required" }, { status: 400 });
  }

  const { error } = await auth.admin
    .from("pack_items")
    .delete()
    .eq("pack_id", id)
    .in("id", item_ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
