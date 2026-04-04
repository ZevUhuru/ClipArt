import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProvider } from "@/lib/social/registry";
import crypto from "crypto";

interface RouteContext {
  params: { provider: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
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

  const state = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("social_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/my-art";
  cookieStore.set("social_oauth_return", returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/${params.provider}/callback`;
  const authUrl = provider.getAuthUrl(state, redirectUri);

  return NextResponse.redirect(authUrl);
}
