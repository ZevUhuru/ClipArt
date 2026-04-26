import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import sharp from "sharp";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { removeBackground } from "@/lib/bgRemoval";
import { getBgRemovalConfig } from "@/lib/imageGen";
import { uploadToR2 } from "@/lib/r2";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://images.clip.art";

/** Derive the R2 key from a public image URL (strips query params). */
function keyFromUrl(imageUrl: string): string {
  const clean = imageUrl.split("?")[0];
  return clean.replace(`${R2_PUBLIC_URL}/`, "");
}

/**
 * Build a new R2 key for the transparent variant by inserting "-t" before the
 * extension: `animals/cute-cat-abc123.webp` → `animals/cute-cat-abc123-t.webp`
 */
function transparentKeyFromKey(key: string): string {
  const lastDot = key.lastIndexOf(".");
  if (lastDot === -1) return `${key}-t`;
  return `${key.slice(0, lastDot)}-t${key.slice(lastDot)}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { generationId } = body;

    if (!generationId || typeof generationId !== "string") {
      return NextResponse.json({ error: "generationId is required" }, { status: 400 });
    }

    const admin = createSupabaseAdmin();

    // Fetch the generation — verify ownership and current state
    const { data: generation, error: fetchError } = await admin
      .from("generations")
      .select("id, image_url, transparent_image_url, user_id, content_type, has_transparency, category")
      .eq("id", generationId)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    if (generation.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (generation.content_type !== "clipart") {
      return NextResponse.json({ error: "Background removal is only available for clipart" }, { status: 400 });
    }

    // Already has a transparent version — return it without re-processing
    if (generation.transparent_image_url) {
      return NextResponse.json({
        hasTransparency: true,
        transparentUrl: generation.transparent_image_url,
      });
    }

    if (generation.has_transparency) {
      // Transparent via auto bg removal during generation — image_url is already the transparent one
      return NextResponse.json({ hasTransparency: true, transparentUrl: generation.image_url });
    }

    // Get the active bg removal model from admin config
    const bgConfig = await getBgRemovalConfig();
    if (!bgConfig.enabled) {
      return NextResponse.json({ error: "Background removal is currently disabled" }, { status: 503 });
    }

    // Pass the public URL directly — avoids fetch+encode round-trip
    const transparentPngBuffer = await removeBackground(generation.image_url, bgConfig.modelId);

    // Convert transparent PNG → transparent WebP
    const webpBuffer = await sharp(transparentPngBuffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // Upload to a new R2 key — preserves the original image_url
    const originalKey = keyFromUrl(generation.image_url);
    const transparentKey = transparentKeyFromKey(originalKey);
    await uploadToR2(webpBuffer, transparentKey, {
      category: generation.category,
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000",
    });

    const transparentUrl = `${R2_PUBLIC_URL}/${transparentKey}`;

    // Store in transparent_image_url; mark has_transparency
    await admin
      .from("generations")
      .update({ has_transparency: true, transparent_image_url: transparentUrl })
      .eq("id", generationId);

    return NextResponse.json({ hasTransparency: true, transparentUrl });
  } catch (err) {
    Sentry.captureException(err, { tags: { type: "bg_removal_on_demand" } });
    console.error("On-demand background removal failed:", err);
    return NextResponse.json({ error: "Background removal failed. Please try again." }, { status: 500 });
  }
}
