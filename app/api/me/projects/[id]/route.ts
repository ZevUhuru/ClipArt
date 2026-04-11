import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAuthedProject(id: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, project: null, admin: null };

  const admin = createSupabaseAdmin();
  const { data: project } = await admin
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return { user, project, admin };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { user, project, admin } = await getAuthedProject(id);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Load items with generation + animation data
    const { data: rawItems } = await admin!
      .from("project_items")
      .select(
        `id, item_type, position, note, added_at, generation_id, animation_id,
         generation:generations!project_items_generation_id_fkey(
           id, image_url, title, slug, category, aspect_ratio, style
         ),
         animation:animations!project_items_animation_id_fkey(
           id, video_url, thumbnail_url, preview_url, status, prompt, duration
         )`
      )
      .eq("project_id", id)
      .order("position", { ascending: true, nullsFirst: false })
      .order("added_at", { ascending: true });

    return NextResponse.json({ project, items: rawItems || [] });
  } catch (err) {
    console.error("[GET /api/me/projects/[id]]", err);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { user, project, admin } = await getAuthedProject(id);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = (body.name as string).trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.cover_image_url !== undefined) updates.cover_image_url = body.cover_image_url;

    const { data, error } = await admin!
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ project: data });
  } catch (err) {
    console.error("[PATCH /api/me/projects/[id]]", err);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { user, project, admin } = await getAuthedProject(id);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await admin!.from("projects").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/me/projects/[id]]", err);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
