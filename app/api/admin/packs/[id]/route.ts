import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createSupabaseAdmin();

  const updates: Record<string, unknown> = {};

  if (body.is_featured !== undefined) updates.is_featured = body.is_featured;
  if (body.is_published !== undefined) updates.is_published = body.is_published;
  if (body.is_free !== undefined) updates.is_free = body.is_free;
  if (body.price_cents !== undefined) updates.price_cents = body.price_cents;
  if (body.stripe_price_id !== undefined) updates.stripe_price_id = body.stripe_price_id;
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.visibility !== undefined) updates.visibility = body.visibility;

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

  if (data?.categories?.slug) {
    revalidatePath(`/design-bundles/${data.categories.slug}`);
  }
  revalidatePath("/design-bundles");

  return NextResponse.json({ pack: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("packs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/design-bundles");
  return NextResponse.json({ success: true });
}
