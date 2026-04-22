import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { generateImage } from "@/lib/imageGen";
import { uploadToR2 } from "@/lib/r2";
import { classifyPrompt } from "@/lib/classify";
import { checkPromptSafety } from "@/lib/promptSafety";
import { type StyleKey, type ContentType, STYLE_DESCRIPTORS, CONTENT_TYPE_ASPECT, isValidStyleForContentType } from "@/lib/styles";

const VALID_CONTENT_TYPES: ContentType[] = ["clipart", "illustration", "coloring"];

function resolveR2Key(contentType: ContentType, cat: string, uniqueSlug: string): string {
  switch (contentType) {
    case "coloring":
      return `coloring-pages/${cat}/${uniqueSlug}.webp`;
    case "illustration":
      return `illustrations/${cat}/${uniqueSlug}.webp`;
    default:
      return `${cat}/${uniqueSlug}.webp`;
  }
}

function revalidateForContentType(contentType: ContentType, cat: string) {
  switch (contentType) {
    case "coloring":
      revalidatePath(`/coloring-pages/${cat}`);
      revalidatePath("/coloring-pages");
      break;
    case "illustration":
      revalidatePath(`/illustrations/${cat}`);
      revalidatePath("/illustrations");
      break;
    default:
      revalidatePath(`/${cat}`);
      break;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, isPublic, aspectRatio: aspectRatioOverride, freeGen } = body;
    const contentType: ContentType = VALID_CONTENT_TYPES.includes(body.contentType)
      ? body.contentType
      : style === "coloring" ? "coloring" : "clipart";

    if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    if (!style || !(style in STYLE_DESCRIPTORS)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    const styleKey = style as StyleKey;

    if (!isValidStyleForContentType(styleKey, contentType)) {
      return NextResponse.json({ error: "Style not available for this content type" }, { status: 400 });
    }

    const safety = checkPromptSafety(prompt);
    if (!safety.safe) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const isFreeGen = !user && freeGen === true;

    if (!user && !isFreeGen) {
      return NextResponse.json({ requiresAuth: true }, { status: 401 });
    }

    const admin = createSupabaseAdmin();
    const validAspectRatios = ["1:1", "3:4", "4:3"];
    const safeOverride = validAspectRatios.includes(aspectRatioOverride) ? aspectRatioOverride : undefined;
    const aspectRatio = safeOverride || CONTENT_TYPE_ASPECT[contentType] || "1:1";

    if (!isFreeGen) {
      const { data: profile } = await admin
        .from("profiles")
        .select("credits")
        .eq("id", user!.id)
        .single();

      if (!profile || profile.credits <= 0) {
        return NextResponse.json({ requiresCredits: true }, { status: 402 });
      }

      const { buffer: rawBuffer, model: imageModel } = await generateImage(prompt, styleKey, contentType, safeOverride);

      const webpBuffer = await sharp(rawBuffer)
        .webp({ quality: 85, effort: 4 })
        .toBuffer();

      const classification = await classifyPrompt(prompt, style, contentType);
      const cat = classification.category;
      const suffix = Math.random().toString(36).slice(2, 8);
      const uniqueSlug = `${classification.slug}-${suffix}`;
      const key = resolveR2Key(contentType, cat, uniqueSlug);
      const imageUrl = await uploadToR2(webpBuffer, key, {
        category: cat,
        contentType: "image/webp",
      });

      await admin
        .from("profiles")
        .update({ credits: profile.credits - 1 })
        .eq("id", user!.id);

      const { data: generation } = await admin
        .from("generations")
        .insert({
          user_id: user!.id,
          prompt,
          style,
          content_type: contentType,
          image_url: imageUrl,
          category: cat,
          is_public: isPublic !== false,
          title: classification.title,
          slug: uniqueSlug,
          description: classification.description,
          aspect_ratio: aspectRatio,
          model: imageModel,
        })
        .select("id, image_url, prompt, title, style, content_type, category, slug, aspect_ratio, model, created_at")
        .single();

      if (isPublic !== false) {
        revalidateForContentType(contentType, cat);
      }

      return NextResponse.json({
        imageUrl,
        credits: profile.credits - 1,
        generation,
      });
    }

    // Anonymous free generation — generate + upload, skip credits and DB record
    const { buffer: rawBuffer } = await generateImage(prompt, styleKey, contentType);

    const webpBuffer = await sharp(rawBuffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const classification = await classifyPrompt(prompt, style, contentType);
    const cat = classification.category;
    const suffix = Math.random().toString(36).slice(2, 8);
    const uniqueSlug = `${classification.slug}-${suffix}`;
    const key = resolveR2Key(contentType, cat, uniqueSlug);
    const imageUrl = await uploadToR2(webpBuffer, key, {
      category: cat,
      contentType: "image/webp",
    });

    return NextResponse.json({ imageUrl, freeGen: true });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { type: "generation_error" },
    });
    console.error("Generation error:", err);

    const message = err instanceof Error ? err.message : String(err);

    if (message.startsWith("BILLING_REQUIRED:")) {
      return NextResponse.json(
        { error: "Image generation service is not configured yet. Please try again later." },
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
      { error: "Generation failed. Please try again." },
      { status: 500 },
    );
  }
}
