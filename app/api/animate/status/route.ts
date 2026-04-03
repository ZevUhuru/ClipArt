import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkAnimationStatus, type AnimationModel } from "@/lib/fal";
import { uploadToR2 } from "@/lib/r2";
import { generateThumbnail } from "@/lib/videoProcessing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const animationId = request.nextUrl.searchParams.get("id");
    if (!animationId) {
      return NextResponse.json({ error: "Missing animation id" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ requiresAuth: true }, { status: 401 });
    }

    const admin = createSupabaseAdmin();

    const { data: animation } = await admin
      .from("animations")
      .select("*")
      .eq("id", animationId)
      .eq("user_id", user.id)
      .single();

    if (!animation) {
      return NextResponse.json({ error: "Animation not found" }, { status: 404 });
    }

    if (animation.status === "completed") {
      return NextResponse.json({
        status: "completed",
        videoUrl: animation.video_url,
        previewUrl: animation.preview_url,
        thumbnailUrl: animation.thumbnail_url,
      });
    }

    if (animation.status === "failed" || animation.status === "refunded") {
      return NextResponse.json({
        status: animation.status,
        error: animation.error_message || "Animation failed",
      });
    }

    if (!animation.fal_request_id) {
      return NextResponse.json({ status: "processing" });
    }

    const SERVER_TIMEOUT_MS = 20 * 60 * 1000;
    const createdAt = new Date(animation.created_at).getTime();
    if (Date.now() - createdAt > SERVER_TIMEOUT_MS) {
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

      await admin
        .from("animations")
        .update({
          status: "refunded",
          error_message: "Timed out after 20 minutes",
          completed_at: new Date().toISOString(),
        })
        .eq("id", animationId);

      return NextResponse.json({
        status: "failed",
        error: "Animation timed out after 20 minutes. Credits have been refunded.",
      });
    }

    const falStatus = await checkAnimationStatus(
      animation.model as AnimationModel,
      animation.fal_request_id,
    );

    if (falStatus.status === "COMPLETED" && falStatus.videoUrl) {
      const videoRes = await fetch(falStatus.videoUrl);
      if (!videoRes.ok) {
        throw new Error("Could not download video from Fal.ai");
      }

      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

      const { data: sourceGen } = await admin
        .from("generations")
        .select("category, slug, image_url")
        .eq("id", animation.source_generation_id)
        .single();

      const category = sourceGen?.category || "free";
      const baseSlug = sourceGen?.slug || animation.id;
      const suffix = Math.random().toString(36).slice(2, 8);
      const animSlug = `${baseSlug}-anim-${suffix}`;

      const videoKey = `animations/${category}/${animSlug}.mp4`;
      const videoUrl = await uploadToR2(videoBuffer, videoKey, {
        contentType: "video/mp4",
        category,
      });

      let thumbnailUrl = "";
      if (sourceGen?.image_url) {
        try {
          const imgRes = await fetch(sourceGen.image_url);
          if (imgRes.ok) {
            const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
            const thumbBuffer = await generateThumbnail(imgBuffer);
            const thumbKey = `animations/${category}/${animSlug}-thumb.webp`;
            thumbnailUrl = await uploadToR2(thumbBuffer, thumbKey, {
              contentType: "image/webp",
              category,
            });
          }
        } catch {
          // Thumbnail generation is non-critical
        }
      }

      await admin
        .from("animations")
        .update({
          status: "completed",
          video_url: videoUrl,
          preview_url: videoUrl,
          thumbnail_url: thumbnailUrl || null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", animationId);

      return NextResponse.json({
        status: "completed",
        videoUrl,
        previewUrl: videoUrl,
        thumbnailUrl: thumbnailUrl || null,
      });
    }

    if (falStatus.status === "FAILED") {
      await admin
        .from("animations")
        .update({
          status: "failed",
          error_message: "Video generation failed",
        })
        .eq("id", animationId);

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

        await admin
          .from("animations")
          .update({ status: "refunded" })
          .eq("id", animationId);
      }

      return NextResponse.json({
        status: "failed",
        error: "Animation generation failed. Credits have been refunded.",
      });
    }

    return NextResponse.json({
      status: falStatus.status === "IN_PROGRESS" ? "processing" : "queued",
      logs: falStatus.logs,
    });
  } catch (err) {
    console.error("Animate status error:", err);
    return NextResponse.json(
      { error: "Could not check animation status" },
      { status: 500 },
    );
  }
}
