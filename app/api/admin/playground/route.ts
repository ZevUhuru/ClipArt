import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { generateClipArt } from "@/lib/gemini";
import { generateWithGeminiPro } from "@/lib/geminiPro";
import { generateWithGptImage1, type GptImageQuality } from "@/lib/gptImage1";
import { generateWithGptImage15 } from "@/lib/gptImage15";
import { generateWithGptImage2 } from "@/lib/gptImage2";
import {
  MODEL_BY_KEY,
  isKnownModel,
  priceFor,
  type AspectKey,
  type Quality,
} from "@/lib/imageModelCatalog";
import { CONTENT_TYPE_TEMPLATES, type ContentType } from "@/lib/styles";

// Ephemeral, admin-only. No DB writes, no R2 uploads, no side effects on
// generation routing. Meant for evaluating a single prompt against any model
// in the catalog — e.g. deciding which model to route a future worksheet
// content type through.

const VALID_ASPECTS: ReadonlySet<AspectKey> = new Set(["square", "landscape", "portrait"]);
const VALID_QUALITIES: ReadonlySet<GptImageQuality> = new Set(["low", "medium", "high"]);
const VALID_WRAPPERS = new Set(["none", "clipart", "coloring", "illustration"]);

const ASPECT_TO_RATIO: Record<AspectKey, string> = {
  square: "1:1",
  landscape: "4:3",
  portrait: "3:4",
};

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return !!profile?.is_admin;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    prompt?: unknown;
    model?: unknown;
    aspect?: unknown;
    quality?: unknown;
    templateWrapper?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: "Prompt too long (max 4000 chars)" }, { status: 400 });
  }

  if (!isKnownModel(body.model)) {
    return NextResponse.json({ error: `Unknown model "${String(body.model)}"` }, { status: 400 });
  }
  const model = body.model;

  if (typeof body.aspect !== "string" || !VALID_ASPECTS.has(body.aspect as AspectKey)) {
    return NextResponse.json({ error: "aspect must be square|landscape|portrait" }, { status: 400 });
  }
  const aspect = body.aspect as AspectKey;

  const meta = MODEL_BY_KEY[model];
  const usesQualityTiers = meta.supportsQualityTiers;

  let quality: GptImageQuality = "medium";
  if (usesQualityTiers) {
    if (body.quality != null) {
      if (typeof body.quality !== "string" || !VALID_QUALITIES.has(body.quality as GptImageQuality)) {
        return NextResponse.json({ error: "quality must be low|medium|high" }, { status: 400 });
      }
      quality = body.quality as GptImageQuality;
    }
  }

  const wrapper: string = typeof body.templateWrapper === "string" ? body.templateWrapper : "none";
  if (!VALID_WRAPPERS.has(wrapper)) {
    return NextResponse.json(
      { error: "templateWrapper must be none|clipart|coloring|illustration" },
      { status: 400 },
    );
  }

  // Optional template append. We intentionally don't include a style
  // descriptor here — the playground's job is to measure model behavior,
  // not style adherence. Keeps the test surface clean.
  const finalPrompt = wrapper === "none"
    ? prompt
    : `${prompt}\n\n${CONTENT_TYPE_TEMPLATES[wrapper as ContentType]}`;

  const aspectRatio = ASPECT_TO_RATIO[aspect];

  const start = performance.now();
  let buffer: Buffer;
  try {
    switch (model) {
      case "gemini":
        buffer = await generateClipArt(finalPrompt, aspectRatio);
        break;
      case "gemini-pro":
        buffer = await generateWithGeminiPro(finalPrompt, aspectRatio);
        break;
      case "gpt-image-1":
        buffer = await generateWithGptImage1(finalPrompt, aspectRatio, quality);
        break;
      case "gpt-image-1.5":
        buffer = await generateWithGptImage15(finalPrompt, aspectRatio, quality);
        break;
      case "gpt-image-2":
        buffer = await generateWithGptImage2(finalPrompt, aspectRatio, quality);
        break;
      default: {
        const _exhaustive: never = model;
        throw new Error(`Unhandled model: ${String(_exhaustive)}`);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const elapsedMs = Math.round(performance.now() - start);

  const priceQuality: Quality = usesQualityTiers ? quality : "flat";
  const estimatedCost = priceFor(model, priceQuality, aspect);

  const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;

  return NextResponse.json({
    dataUrl,
    model,
    quality: priceQuality,
    aspect,
    elapsedMs,
    estimatedCost,
    finalPrompt,
  });
}
