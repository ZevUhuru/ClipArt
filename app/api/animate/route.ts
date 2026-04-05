import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkPromptSafety } from "@/lib/promptSafety";
import { submitAnimation, type AnimationModel, calculateCredits, MAX_DURATION, AUDIO_SUPPORTED } from "@/lib/fal";

const VALID_MODELS: AnimationModel[] = ["kling-2.5-turbo", "kling-3.0-standard", "kling-3.0-pro"];
const ALLOWED_IMAGE_HOST = "images.clip.art";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUrl, prompt, model: rawModel, duration: rawDuration, audio: rawAudio, promptId } = body;

    if (!sourceUrl || typeof sourceUrl !== "string") {
      return NextResponse.json({ error: "Missing source image URL" }, { status: 400 });
    }

    if (!prompt || typeof prompt !== "string" || prompt.length > 1000) {
      return NextResponse.json({ error: "Invalid animation prompt" }, { status: 400 });
    }

    const safety = checkPromptSafety(prompt);
    if (!safety.safe) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return NextResponse.json({ error: "Invalid source URL" }, { status: 400 });
    }

    if (parsedUrl.hostname !== ALLOWED_IMAGE_HOST) {
      return NextResponse.json({ error: "Source must be a clip.art image" }, { status: 400 });
    }

    const model: AnimationModel = VALID_MODELS.includes(rawModel) ? rawModel : "kling-3.0-standard";
    const maxDur = MAX_DURATION[model];
    const duration = typeof rawDuration === "number" && rawDuration >= 5 && rawDuration <= maxDur
      ? Math.round(rawDuration)
      : 5;
    const audio = rawAudio === true && AUDIO_SUPPORTED[model];
    const creditsNeeded = calculateCredits(model, duration, audio);

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ requiresAuth: true }, { status: 401 });
    }

    const admin = createSupabaseAdmin();

    const { data: profile } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < creditsNeeded) {
      return NextResponse.json({ requiresCredits: true, creditsNeeded }, { status: 402 });
    }

    const { data: sourceGen } = await admin
      .from("generations")
      .select("id, category, style, title, slug")
      .eq("image_url", sourceUrl)
      .single();

    const { requestId } = await submitAnimation(sourceUrl, prompt, model, duration, audio);

    await admin
      .from("profiles")
      .update({ credits: profile.credits - creditsNeeded })
      .eq("id", user.id);

    const slugBase = (sourceGen?.title || prompt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const slugSuffix = crypto.randomUUID().slice(0, 8);
    const slug = `${slugBase}-${slugSuffix}`;

    const { data: animation } = await admin
      .from("animations")
      .insert({
        user_id: user.id,
        source_generation_id: sourceGen?.id || null,
        prompt,
        model,
        duration,
        generate_audio: audio,
        status: "processing",
        fal_request_id: requestId,
        credits_charged: creditsNeeded,
        is_public: true,
        slug,
      })
      .select("id, status, created_at")
      .single();

    if (promptId && typeof promptId === "string") {
      const { data: row } = await admin
        .from("animation_prompts")
        .select("use_count")
        .eq("id", promptId)
        .single();
      if (row) {
        await admin
          .from("animation_prompts")
          .update({ use_count: (row.use_count || 0) + 1 })
          .eq("id", promptId);
      }
    }

    return NextResponse.json({
      animationId: animation?.id,
      status: "processing",
      creditsRemaining: profile.credits - creditsNeeded,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { type: "animation_submit_error" },
    });
    console.error("Animate error:", err);

    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("429") || message.includes("rate")) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Animation failed to start. Please try again." },
      { status: 500 },
    );
  }
}
