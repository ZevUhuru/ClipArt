import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ jobs: [] }, { status: 401 });
    }

    const admin = createSupabaseAdmin();

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: processing } = await admin
      .from("animations")
      .select(
        "id, prompt, model, duration, generate_audio, status, created_at, video_url, " +
        "source:generations!animations_source_generation_id_fkey(image_url, title)",
      )
      .eq("user_id", user.id)
      .eq("status", "processing")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: recent } = await admin
      .from("animations")
      .select(
        "id, prompt, model, duration, generate_audio, status, created_at, video_url, error_message, " +
        "source:generations!animations_source_generation_id_fkey(image_url, title)",
      )
      .eq("user_id", user.id)
      .in("status", ["completed", "failed", "refunded"])
      .gte("completed_at", thirtyMinAgo)
      .order("completed_at", { ascending: false })
      .limit(5);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function mapJob(a: any) {
      const src = a.source as Record<string, string> | null;
      return {
        id: a.id,
        sourceUrl: src?.image_url || "",
        sourceTitle: src?.title || "Untitled",
        prompt: a.prompt,
        model: a.model,
        duration: a.duration || 5,
        audio: a.generate_audio || false,
        status: a.status === "refunded" ? "failed" : a.status,
        videoUrl: a.video_url || undefined,
        error: a.error_message || undefined,
        startedAt: new Date(a.created_at).getTime(),
      };
    }

    const jobs = [
      ...(processing || []).map(mapJob),
      ...(recent || []).map(mapJob),
    ];

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("[pending-animations]", err);
    return NextResponse.json({ jobs: [] }, { status: 500 });
  }
}
