import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getProvider } from "@/lib/social/registry";

interface RouteContext {
  params: { provider: string };
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const provider = getProvider(params.provider);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data: connection } = await admin
    .from("social_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", params.provider)
    .single();

  if (connection?.access_token) {
    await provider.revokeToken(connection.access_token);
  }

  await admin
    .from("social_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", params.provider);

  return NextResponse.json({ disconnected: true });
}
