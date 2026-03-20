import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { generateClipArt } from "@/lib/gemini";
import { uploadToR2 } from "@/lib/r2";
import { buildPrompt, type StyleKey, STYLES } from "@/lib/styles";

const FREE_LIMIT = 5;
const COOKIE_NAME = "clip_art_free";

const VALID_CATEGORIES = new Set([
  "christmas", "heart", "halloween", "flower", "school",
  "book", "pumpkin", "cat", "thanksgiving", "free",
]);

function slugifyPrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, category } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.length > 500) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    if (!style || !(style in STYLES)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    const validCategory = category && VALID_CATEGORIES.has(category) ? category : null;

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    // Anonymous: check cookie-based free tier
    if (!user) {
      const cookieStore = await cookies();
      const freeCount = parseInt(cookieStore.get(COOKIE_NAME)?.value || "0", 10);

      if (freeCount >= FREE_LIMIT) {
        return NextResponse.json({ requiresAuth: true }, { status: 401 });
      }

      const fullPrompt = buildPrompt(prompt, style as StyleKey);
      const imageBuffer = await generateClipArt(fullPrompt);

      const slug = slugifyPrompt(prompt);
      const uid = Math.random().toString(36).slice(2, 8);
      const key = `free/${slug}-${uid}.png`;
      const imageUrl = await uploadToR2(imageBuffer, key);

      const response = NextResponse.json({ imageUrl });
      response.cookies.set(COOKIE_NAME, String(freeCount + 1), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return response;
    }

    // Authenticated: check credits
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
    const imageBuffer = await generateClipArt(fullPrompt);

    const slug = slugifyPrompt(prompt);
    const uid = Math.random().toString(36).slice(2, 8);
    const dir = validCategory || `gen/${user.id}`;
    const key = `${dir}/${slug}-${uid}.png`;
    const imageUrl = await uploadToR2(imageBuffer, key, {
      category: validCategory || undefined,
    });

    // Deduct credit and save generation record
    await admin
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id);

    await admin.from("generations").insert({
      user_id: user.id,
      prompt,
      style,
      image_url: imageUrl,
    });

    return NextResponse.json({ imageUrl, credits: profile.credits - 1 });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 },
    );
  }
}
