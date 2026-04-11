import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing animation id" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdmin();

    const { data: animation } = await admin
      .from("animations")
      .select("id, status, credits_charged")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!animation) {
      return NextResponse.json({ error: "Animation not found" }, { status: 404 });
    }

    if (animation.status !== "processing") {
      return NextResponse.json({ ok: true });
    }

    await admin
      .from("animations")
      .update({
        status: "failed",
        error_message: "Cancelled by user",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (animation.credits_charged > 0) {
      const { data: profile } = await admin
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (profile) {
        await admin
          .from("profiles")
          .update({ credits: profile.credits + animation.credits_charged })
          .eq("id", user.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[animate-cancel]", err);
    return NextResponse.json({ error: "Failed to cancel animation" }, { status: 500 });
  }
}
