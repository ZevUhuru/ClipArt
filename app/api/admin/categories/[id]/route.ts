import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createSupabaseAdmin();

  const updates: Record<string, unknown> = {};
  const fields = [
    "name", "h1", "meta_title", "meta_description", "intro",
    "seo_content", "suggested_prompts", "related_slugs",
    "is_active", "sort_order",
  ];

  for (const field of fields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (body.slug !== undefined) {
    updates.slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  }

  const { data, error } = await admin
    .from("categories")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.slug) revalidatePath(`/${data.slug}`);

  return NextResponse.json({ category: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("categories")
    .select("slug")
    .eq("id", params.id)
    .single();

  await admin.from("categories").delete().eq("id", params.id);

  if (existing?.slug) revalidatePath(`/${existing.slug}`);

  return NextResponse.json({ success: true });
}
