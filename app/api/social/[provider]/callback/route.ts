import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getProvider } from "@/lib/social/registry";

interface RouteContext {
  params: { provider: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const origin = request.nextUrl.origin;
  const cookieStore = await cookies();
  const returnTo = cookieStore.get("social_oauth_return")?.value || "/my-art";

  function errorRedirect(msg: string) {
    const url = new URL(returnTo, origin);
    url.searchParams.set("social_error", msg);
    return NextResponse.redirect(url);
  }

  const provider = getProvider(params.provider);
  if (!provider) return errorRedirect("Unknown provider");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = cookieStore.get("social_oauth_state")?.value;

  cookieStore.delete("social_oauth_state");
  cookieStore.delete("social_oauth_return");

  if (!code || !state || state !== savedState) {
    return errorRedirect("Invalid OAuth state");
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorRedirect("Not authenticated");

  try {
    const redirectUri = `${origin}/api/social/${params.provider}/callback`;
    const tokens = await provider.exchangeCode(code, redirectUri);
    const admin = createSupabaseAdmin();

    await admin.from("social_connections").upsert(
      {
        user_id: user.id,
        provider: params.provider,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken || null,
        expires_at: tokens.expiresAt?.toISOString() || null,
        account_id: tokens.accountId || null,
        account_name: tokens.accountName || null,
      },
      { onConflict: "user_id,provider" },
    );

    const url = new URL(returnTo, origin);
    url.searchParams.set("social_connected", params.provider);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error(`OAuth callback error for ${params.provider}:`, err);
    return errorRedirect("Failed to connect account");
  }
}
