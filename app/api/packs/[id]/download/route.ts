import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign up for free to download packs" },
      { status: 401 },
    );
  }

  const admin = createSupabaseAdmin();
  const { data: pack } = await admin
    .from("packs")
    .select("id, zip_url, zip_status, visibility, is_published, is_free, user_id, price_cents, downloads")
    .eq("id", id)
    .single();

  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (pack.visibility === "private" && pack.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!pack.is_published || pack.zip_status !== "ready" || !pack.zip_url) {
    return NextResponse.json({ error: "Pack is not available for download" }, { status: 400 });
  }

  if (!pack.is_free) {
    const { data: purchase } = await admin
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("stripe_session_id", `pack_${pack.id}`)
      .single();

    if (!purchase && pack.user_id !== user.id) {
      return NextResponse.json({ error: "Purchase required" }, { status: 402 });
    }
  }

  admin
    .from("packs")
    .update({ downloads: (pack.downloads || 0) + 1 })
    .eq("id", id)
    .then(() => {})
    .catch(() => {});

  return NextResponse.json({ download_url: pack.zip_url });
}
