import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import sharp from "sharp";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { editWithGptImage2, GPT_IMAGE_2_MODEL_ID } from "@/lib/gptImage2";
import { removeBackground } from "@/lib/bgRemoval";
import { getBgRemovalConfig } from "@/lib/imageGen";
import { uploadToR2 } from "@/lib/r2";
import { checkPromptSafety } from "@/lib/promptSafety";

const ALLOWED_IMAGE_HOST = "images.clip.art";
const CLIPART_CONTENT_TYPE = "clipart";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUrl, instruction, isPublic } = body;

    if (!sourceUrl || typeof sourceUrl !== "string") {
      return NextResponse.json({ error: "Missing source image URL" }, { status: 400 });
    }

    if (!instruction || typeof instruction !== "string" || instruction.length > 2000) {
      return NextResponse.json({ error: "Invalid edit instruction" }, { status: 400 });
    }

    const safety = checkPromptSafety(instruction);
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

    if (!profile || profile.credits <= 0) {
      return NextResponse.json({ requiresCredits: true }, { status: 402 });
    }

    const { data: sourceGen } = await admin
      .from("generations")
      .select("id, category, style, title, slug, aspect_ratio, content_type")
      .eq("image_url", sourceUrl)
      .single();

    const sourceRes = await fetch(sourceUrl);
    if (!sourceRes.ok) {
      return NextResponse.json({ error: "Could not fetch source image" }, { status: 400 });
    }

    const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer());
    const contentType = sourceRes.headers.get("content-type") || "image/webp";

    const category = sourceGen?.category || "free";
    const style = sourceGen?.style || "flat";
    const generationContentType = sourceGen?.content_type || CLIPART_CONTENT_TYPE;
    const aspectRatio = sourceGen?.aspect_ratio || "1:1";
    const editPrompt = [
      instruction,
      "Preserve the source image's core subject, style, composition, and clean product-art presentation unless the instruction explicitly says otherwise.",
    ].join(" ");

    const [editedBuffer, bgRemovalConfig] = await Promise.all([
      editWithGptImage2(sourceBuffer, contentType, editPrompt, aspectRatio),
      getBgRemovalConfig(),
    ]);

    let processedBuffer = editedBuffer;
    let hasTransparency = false;
    if (generationContentType === CLIPART_CONTENT_TYPE && bgRemovalConfig.enabled) {
      try {
        processedBuffer = await removeBackground(editedBuffer, bgRemovalConfig.modelId);
        hasTransparency = true;
      } catch (bgErr) {
        Sentry.captureException(bgErr, { tags: { type: "edit_bg_removal_error" } });
        console.error("Edit background removal failed, using original:", bgErr);
      }
    }

    const webpBuffer = await sharp(processedBuffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const suffix = Math.random().toString(36).slice(2, 8);
    const baseSlug = sourceGen?.slug?.replace(/-[a-z0-9]{6}$/, "") || "edited";
    const editSlug = `${baseSlug}-edit-${suffix}`;

    const key = `edits/${category}/${editSlug}.webp`;
    const imageUrl = await uploadToR2(webpBuffer, key, {
      category,
      contentType: "image/webp",
    });

    await admin
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id);

    const editTitle = `Edited: ${sourceGen?.title || instruction.slice(0, 60)}`;

    const { data: generation } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        prompt: instruction,
        style,
        image_url: imageUrl,
        category,
        content_type: generationContentType,
        is_public: isPublic !== false,
        title: editTitle,
        slug: editSlug,
        description: `AI edit: ${instruction.slice(0, 160)}`,
        aspect_ratio: aspectRatio,
        parent_id: sourceGen?.id || null,
        model: GPT_IMAGE_2_MODEL_ID,
        has_transparency: hasTransparency,
      })
      .select("id, image_url, prompt, style, content_type, category, slug, aspect_ratio, model, has_transparency, created_at")
      .single();

    if (isPublic !== false) {
      revalidatePath(`/${category}`);
    }

    return NextResponse.json({
      imageUrl,
      credits: profile.credits - 1,
      generation,
    });
  } catch (err) {
    console.error("Edit error:", err);

    const message = err instanceof Error ? err.message : String(err);

    if (message.startsWith("BILLING_REQUIRED:")) {
      return NextResponse.json(
        { error: "Image editing service is not configured yet. Please try again later." },
        { status: 503 },
      );
    }

    if (message.startsWith("RATE_LIMITED:")) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Edit failed. Please try again." },
      { status: 500 },
    );
  }
}
