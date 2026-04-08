import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data: pack } = await admin
    .from("packs")
    .select("id, zip_status, zip_url, item_count, is_published")
    .eq("id", id)
    .single();

  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    zip_status: pack.zip_status,
    zip_url: pack.zip_url,
    item_count: pack.item_count,
    is_published: pack.is_published,
  });
}
