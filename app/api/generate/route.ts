import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { generateClipArt } from "@/lib/gemini";
import { uploadToR2 } from "@/lib/r2";
import { buildPrompt, type StyleKey, STYLES } from "@/lib/styles";

const FREE_LIMIT = 5;
const COOKIE_NAME = "clip_art_free";

export async function POST(request: NextRequest) {
  try {
    const { prompt, style } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.length > 500) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    if (!style || !(style in STYLES)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

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

      const key = `free/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const imageUrl = await uploadToR2(imageBuffer, key);

      const response = NextResponse.json({ imageUrl });
      response.cookies.set(COOKIE_NAME, String(freeCount + 1), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
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

    const key = `gen/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const imageUrl = await uploadToR2(imageBuffer, key);

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
