import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import sharp from "sharp";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { removeBackground } from "@/lib/bgRemoval";
import { getBgRemovalConfig } from "@/lib/imageGen";
import { uploadToR2 } from "@/lib/r2";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://images.clip.art";

/** Derive the R2 key from a public image URL. */
function keyFromUrl(imageUrl: string): string {
  return imageUrl.replace(`${R2_PUBLIC_URL}/`, "");
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
      .select("id, image_url, user_id, content_type, has_transparency, category")
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

    if (generation.has_transparency) {
      // Already transparent — return current state without re-processing
      return NextResponse.json({ hasTransparency: true, imageUrl: generation.image_url });
    }

    // Get the active bg removal model from admin config
    const bgConfig = await getBgRemovalConfig();
    if (!bgConfig.enabled) {
      return NextResponse.json({ error: "Background removal is currently disabled" }, { status: 503 });
    }

    // Pass the public URL directly — avoids fetch+encode round-trip
    const transparentPngBuffer = await removeBackground(generation.image_url, bgConfig.modelId);

    // Convert transparent PNG → transparent WebP for R2 storage
    const webpBuffer = await sharp(transparentPngBuffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // Overwrite the existing R2 object with the transparent version.
    // Use a shorter max-age so CDN caches refresh within a day.
    const key = keyFromUrl(generation.image_url);
    await uploadToR2(webpBuffer, key, {
      category: generation.category,
      contentType: "image/webp",
      cacheControl: "public, max-age=86400",
    });

    // Update the DB record
    await admin
      .from("generations")
      .update({ has_transparency: true })
      .eq("id", generationId);

    // Return the same URL with a cache-buster so the drawer gets the fresh version
    const cacheBuster = Date.now();
    return NextResponse.json({
      hasTransparency: true,
      imageUrl: generation.image_url,
      cacheBuster,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { type: "bg_removal_on_demand" } });
    console.error("On-demand background removal failed:", err);
    return NextResponse.json({ error: "Background removal failed. Please try again." }, { status: 500 });
  }
}
