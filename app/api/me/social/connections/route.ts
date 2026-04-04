import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("social_connections")
    .select("provider, account_id, account_name, created_at")
    .eq("user_id", user.id);

  return NextResponse.json({ connections: data || [] });
}
