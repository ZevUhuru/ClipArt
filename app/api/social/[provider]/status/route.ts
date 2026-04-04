import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getProvider } from "@/lib/social/registry";

interface RouteContext {
  params: { provider: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const provider = getProvider(params.provider);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("social_connections")
    .select("account_id, account_name, created_at")
    .eq("user_id", user.id)
    .eq("provider", params.provider)
    .single();

  if (!data) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    accountId: data.account_id,
    accountName: data.account_name,
    connectedAt: data.created_at,
  });
}
