import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt_text, category, style, difficulty } = body;

    if (!prompt_text || !category || !style || !difficulty) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Resolve the user id server-side (avoids browser auth timing issues)
    const serverClient = await createSupabaseServer();
    const { data: { user } } = await serverClient.auth.getUser();

    // Use admin client so the insert + returning id is never blocked by RLS
    const admin = await createSupabaseAdmin();
    const { data, error } = await admin
      .from("prompt_library_uses")
      .insert({
        prompt_text,
        category,
        style,
        difficulty,
        user_id: user?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[prompt-library-track]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error("[prompt-library-track] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
