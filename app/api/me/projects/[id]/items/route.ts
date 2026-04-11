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
    .select("id, user_id, project_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return { user, project, admin };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { user, project, admin } = await getAuthedProject(id);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json();
    const item_type = body.item_type === "shot" ? "shot" : "asset";

    if (item_type === "shot") {
      if (!body.generation_id) {
        return NextResponse.json({ error: "generation_id required for shot" }, { status: 400 });
      }
      // Get the next position
      const { count } = await admin!
        .from("project_items")
        .select("id", { count: "exact", head: true })
        .eq("project_id", id);

      const { data, error } = await admin!
        .from("project_items")
        .insert({
          project_id: id,
          item_type: "shot",
          generation_id: body.generation_id,
          animation_id: body.animation_id || null,
          note: body.note || null,
          position: (count ?? 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Update item_count on project
      await admin!
        .from("projects")
        .update({ item_count: (count ?? 0) + 1 })
        .eq("id", id);

      return NextResponse.json({ item: data }, { status: 201 });
    }

    // Asset: generation or animation
    if (!body.generation_id && !body.animation_id) {
      return NextResponse.json(
        { error: "generation_id or animation_id required for asset" },
        { status: 400 },
      );
    }

    const { count } = await admin!
      .from("project_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id);

    const { data, error } = await admin!
      .from("project_items")
      .insert({
        project_id: id,
        item_type: "asset",
        generation_id: body.generation_id || null,
        animation_id: body.animation_id || null,
        note: body.note || null,
        position: (count ?? 0) + 1,
      })
      .select()
      .single();

    if (error) throw error;

    await admin!
      .from("projects")
      .update({ item_count: (count ?? 0) + 1 })
      .eq("id", id);

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/me/projects/[id]/items]", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
