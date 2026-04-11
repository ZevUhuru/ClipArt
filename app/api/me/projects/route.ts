import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ projects: [] }, { status: 401 });

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ projects: data || [] });
  } catch (err) {
    console.error("[GET /api/me/projects]", err);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = (body.name as string | undefined)?.trim();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const project_type = body.project_type === "short" ? "short" : "collection";

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("projects")
      .insert({ user_id: user.id, name, project_type, description: body.description || null })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/me/projects]", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
