import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { generateClipArt } from "@/lib/gemini";
import { uploadToR2 } from "@/lib/r2";
import { classifyPrompt } from "@/lib/classify";
import { buildPrompt, type StyleKey, STYLES } from "@/lib/styles";

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, isPublic } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.length > 500) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    if (!style || !(style in STYLES)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
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

    const fullPrompt = buildPrompt(prompt, style as StyleKey);
    const rawBuffer = await generateClipArt(fullPrompt);

    const webpBuffer = await sharp(rawBuffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const classification = await classifyPrompt(prompt, style);
    const cat = classification.category;
    const suffix = Math.random().toString(36).slice(2, 8);
    const uniqueSlug = `${classification.slug}-${suffix}`;
    const key = `${cat}/${uniqueSlug}.webp`;
    const imageUrl = await uploadToR2(webpBuffer, key, {
      category: cat,
      contentType: "image/webp",
    });

    await admin
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id);

    const { data: generation } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        prompt,
        style,
        image_url: imageUrl,
        category: cat,
        is_public: isPublic !== false,
        title: classification.title,
        slug: uniqueSlug,
        description: classification.description,
      })
      .select("id, image_url, prompt, style, category, slug, created_at")
      .single();

    if (isPublic !== false) revalidatePath(`/${cat}`);

    return NextResponse.json({
      imageUrl,
      credits: profile.credits - 1,
      generation,
    });
  } catch (err) {
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
