import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data: pack } = await admin
    .from("packs")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!pack || pack.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { order } = body;

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order array is required" }, { status: 400 });
  }

  const updates = order.map((itemId: string, index: number) =>
    admin
      .from("pack_items")
      .update({ sort_order: index })
      .eq("id", itemId)
      .eq("pack_id", id),
  );

  await Promise.all(updates);

  return NextResponse.json({ success: true });
}
