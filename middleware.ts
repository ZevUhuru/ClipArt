import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// How often we touch profiles.last_seen_at. A short-lived cookie suppresses
// repeat writes within this window so middleware stays cheap.
const LAST_SEEN_THROTTLE_SECONDS = 60;
const LAST_SEEN_COOKIE = "cla_seen";

export async function middleware(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !request.cookies.get(LAST_SEEN_COOKIE)) {
    // Fire-and-forget: don't block the response on this write.
    supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", user.id)
      .then(() => undefined);

    supabaseResponse.cookies.set(LAST_SEEN_COOKIE, "1", {
      maxAge: LAST_SEEN_THROTTLE_SECONDS,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
