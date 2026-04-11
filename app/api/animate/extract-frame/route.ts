import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { extractVideoFrame } from "@/lib/fal";
import { uploadToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { animationId, frameType = "last" } = body as {
      animationId: string;
      frameType?: "first" | "middle" | "last";
    };

    if (!animationId) {
      return NextResponse.json({ error: "Missing animationId" }, { status: 400 });
    }
    if (!["first", "middle", "last"].includes(frameType)) {
      return NextResponse.json({ error: "Invalid frameType" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ requiresAuth: true }, { status: 401 });

    const admin = createSupabaseAdmin();

    const { data: animation } = await admin
      .from("animations")
      .select("id, video_url, status, source_generation_id, last_frame_url")
      .eq("id", animationId)
      .eq("user_id", user.id)
      .single();

    if (!animation) {
      return NextResponse.json({ error: "Animation not found" }, { status: 404 });
    }
    if (animation.status !== "completed" || !animation.video_url) {
      return NextResponse.json({ error: "Animation is not completed" }, { status: 400 });
    }

    // Return cached result if already extracted
    if (frameType === "last" && animation.last_frame_url) {
      return NextResponse.json({ frameUrl: animation.last_frame_url });
    }

    // Extract the frame via fal.ai
    const falFrameUrl = await extractVideoFrame(animation.video_url, frameType);

    // Download from fal.ai temp URL and upload to R2 for permanence
    const imgRes = await fetch(falFrameUrl);
    if (!imgRes.ok) throw new Error("Could not download frame from fal.ai");
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Derive a path from the animation ID
    const { data: sourceGen } = await admin
      .from("generations")
      .select("category, slug")
      .eq("id", animation.source_generation_id)
      .maybeSingle();

    const category = sourceGen?.category || "free";
    const baseSlug = sourceGen?.slug || animation.id;
    const frameKey = `animations/${category}/${baseSlug}-${frameType}-frame-${animation.id.slice(0, 8)}.jpg`;

    const frameUrl = await uploadToR2(imgBuffer, frameKey, {
      contentType: "image/jpeg",
      category,
    });

    // Persist to DB for caching (only for last frame)
    if (frameType === "last") {
      await admin
        .from("animations")
        .update({ last_frame_url: frameUrl })
        .eq("id", animationId);
    }

    return NextResponse.json({ frameUrl });
  } catch (err) {
    Sentry.captureException(err, { tags: { type: "extract_frame_error" } });
    console.error("Extract frame error:", err);
    return NextResponse.json({ error: "Failed to extract frame" }, { status: 500 });
  }
}
