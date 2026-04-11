import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { generateImage } from "@/lib/imageGen";
import { uploadToR2 } from "@/lib/r2";
import { classifyPrompt } from "@/lib/classify";
import { checkPromptSafety } from "@/lib/promptSafety";
import {
  type StyleKey,
  type ContentType,
  STYLE_DESCRIPTORS,
  CONTENT_TYPE_ASPECT,
  isValidStyleForContentType,
} from "@/lib/styles";
import sharp from "sharp";

export const maxDuration = 120;

const VALID_CONTENT_TYPES: ContentType[] = ["clipart", "illustration", "coloring"];

const VARIATION_TEMPLATES = [
  (base: string) => base,
  (base: string) => `${base}, different angle`,
  (base: string) => `${base}, variation with unique details`,
  (base: string) => `${base}, alternative design`,
  (base: string) => `${base}, creative interpretation`,
  (base: string) => `${base}, simplified version`,
  (base: string) => `${base}, detailed version`,
  (base: string) => `${base}, playful style`,
  (base: string) => `${base}, elegant version`,
  (base: string) => `${base}, minimalist design`,
];

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

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { prompt, style, count: rawCount, pack_id } = body;
  const contentType: ContentType = VALID_CONTENT_TYPES.includes(body.contentType)
    ? body.contentType
    : style === "coloring"
      ? "coloring"
      : "clipart";

  if (!prompt || typeof prompt !== "string" || prompt.length > 1000) {
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

  const count = Math.min(Math.max(1, parseInt(rawCount) || 5), 20);

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits < count) {
    return NextResponse.json(
      {
        error: `Insufficient credits. You need ${count} credits but have ${profile?.credits || 0}.`,
        requiresCredits: true,
      },
      { status: 402 },
    );
  }

  const aspectRatio = CONTENT_TYPE_ASPECT[contentType] || "1:1";
  const results: Array<{
    id: string;
    image_url: string;
    title: string;
    slug: string;
    prompt: string;
  }> = [];
  let creditsUsed = 0;

  for (let i = 0; i < count; i++) {
    const variationFn = VARIATION_TEMPLATES[i % VARIATION_TEMPLATES.length];
    const variedPrompt = i === 0 ? prompt : variationFn(prompt);

    try {
      const { buffer: rawBuffer, model: imageModel } = await generateImage(variedPrompt, styleKey, contentType);
      const webpBuffer = await sharp(rawBuffer)
        .webp({ quality: 85, effort: 4 })
        .toBuffer();

      const classification = await classifyPrompt(variedPrompt, style, contentType);
      const cat = classification.category;
      const suffix = Math.random().toString(36).slice(2, 8);
      const uniqueSlug = `${classification.slug}-${suffix}`;
      const key = resolveR2Key(contentType, cat, uniqueSlug);
      const imageUrl = await uploadToR2(webpBuffer, key, {
        category: cat,
        contentType: "image/webp",
      });

      const { data: generation } = await admin
        .from("generations")
        .insert({
          user_id: user.id,
          prompt: variedPrompt,
          style,
          content_type: contentType,
          image_url: imageUrl,
          category: cat,
          is_public: true,
          title: classification.title,
          slug: uniqueSlug,
          description: classification.description,
          aspect_ratio: aspectRatio,
          model: imageModel,
        })
        .select("id, image_url, title, slug, prompt")
        .single();

      if (generation) {
        results.push(generation);
        creditsUsed++;
      }
    } catch (err) {
      console.error(`Batch generation ${i + 1}/${count} failed:`, err);
    }
  }

  if (creditsUsed > 0) {
    await admin
      .from("profiles")
      .update({ credits: profile.credits - creditsUsed })
      .eq("id", user.id);
  }

  if (pack_id && results.length > 0) {
    const { data: maxOrder } = await admin
      .from("pack_items")
      .select("sort_order")
      .eq("pack_id", pack_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    let nextOrder = (maxOrder?.sort_order ?? -1) + 1;
    const rows = results.map((gen) => ({
      pack_id,
      generation_id: gen.id,
      sort_order: nextOrder++,
    }));

    await admin
      .from("pack_items")
      .upsert(rows, { onConflict: "pack_id,generation_id", ignoreDuplicates: true });
  }

  return NextResponse.json({
    results,
    credits_used: creditsUsed,
    credits_remaining: profile.credits - creditsUsed,
  });
}
