import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { generateCategorySEO } from "@/lib/classify";

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

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data || [] });
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { slug, name, auto_seo } = body;

  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  let seoFields = {
    h1: body.h1 || `${name} Clip Art`,
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    intro: body.intro || null,
    seo_content: body.seo_content || [],
    suggested_prompts: body.suggested_prompts || [],
  };

  if (auto_seo) {
    seoFields = await generateCategorySEO(name);
  }

  const { data: maxOrder } = await admin
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.sort_order || 0) + 1;

  const { data, error } = await admin
    .from("categories")
    .insert({
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name,
      ...seoFields,
      related_slugs: body.related_slugs || [],
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/${data.slug}`);

  return NextResponse.json({ category: data }, { status: 201 });
}
