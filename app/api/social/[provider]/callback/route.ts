import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getProvider } from "@/lib/social/registry";

interface RouteContext {
  params: { provider: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const origin = request.nextUrl.origin;
  const returnTo = request.cookies.get("social_oauth_return")?.value || "/my-art";

  function errorRedirect(msg: string) {
    const url = new URL(returnTo, origin);
    url.searchParams.set("social_error", msg);
    const res = NextResponse.redirect(url);
    res.cookies.delete("social_oauth_state");
    res.cookies.delete("social_oauth_return");
    return res;
  }

  const provider = getProvider(params.provider);
  if (!provider) return errorRedirect("Unknown provider");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("social_oauth_state")?.value;

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
    const response = NextResponse.redirect(url);
    response.cookies.delete("social_oauth_state");
    response.cookies.delete("social_oauth_return");
    return response;
  } catch (err) {
    console.error(`OAuth callback error for ${params.provider}:`, err);
    return errorRedirect("Failed to connect account");
  }
}
