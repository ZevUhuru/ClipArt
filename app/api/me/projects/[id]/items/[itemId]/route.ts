import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAuthedItem(projectId: string, itemId: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, item: null, admin: null };

  const admin = createSupabaseAdmin();

  // Verify project ownership
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { user, item: null, admin };

  const { data: item } = await admin
    .from("project_items")
    .select("*")
    .eq("id", itemId)
    .eq("project_id", projectId)
    .single();

  return { user, item, admin };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  try {
    const { user, item, admin } = await getAuthedItem(id, itemId);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.note !== undefined) updates.note = body.note;
    if (body.animation_id !== undefined) updates.animation_id = body.animation_id;
    if (body.position !== undefined) updates.position = body.position;

    const { data, error } = await admin!
      .from("project_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("[PATCH /api/me/projects/[id]/items/[itemId]]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  try {
    const { user, item, admin } = await getAuthedItem(id, itemId);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await admin!.from("project_items").delete().eq("id", itemId);

    // Decrement item_count
    const { count } = await admin!
      .from("project_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id);

    await admin!
      .from("projects")
      .update({ item_count: count ?? 0 })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/me/projects/[id]/items/[itemId]]", err);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
