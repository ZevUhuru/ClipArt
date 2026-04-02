import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getAnimationSystemPrompt } from "@/lib/promptKnowledge";

export const dynamic = "force-dynamic";

let _ai: InstanceType<typeof GoogleGenAI> | null = null;
function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _ai;
}

const MODEL = "gemini-2.5-flash";

interface Suggestion {
  id?: string;
  title: string;
  prompt: string;
  use_count?: number;
  is_ai_generated?: boolean;
}

async function downloadImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download image");

  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return { base64, mimeType: contentType.split(";")[0] };
}

async function getCachedPrompts(generationId: string): Promise<Suggestion[] | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("animation_prompts")
    .select("id, title, prompt, use_count, is_ai_generated")
    .eq("generation_id", generationId)
    .eq("is_public", true)
    .order("use_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  if (data && data.length > 0) return data;
  return null;
}

async function persistPrompts(
  generationId: string,
  userId: string,
  suggestions: Suggestion[],
): Promise<Suggestion[]> {
  const admin = createSupabaseAdmin();
  const rows = suggestions.map((s) => ({
    generation_id: generationId,
    created_by: userId,
    title: s.title,
    prompt: s.prompt,
    is_ai_generated: true,
    is_public: true,
  }));

  const { data } = await admin
    .from("animation_prompts")
    .insert(rows)
    .select("id, title, prompt, use_count, is_ai_generated");

  return data || suggestions;
}

async function generateWithGemini(imageUrl: string): Promise<Suggestion[]> {
  const { base64, mimeType } = await downloadImageAsBase64(imageUrl);

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: "Study this image carefully. Identify the subject, their pose, any objects, and the energy of the scene. Then write 5 comprehensive animation prompts (60-150 words each) that would bring this specific image to life as a 5-second video clip. Each prompt should take a completely different creative approach — action, emotional, cinematic, playful, and dramatic. Write rich scene direction with physical motion, camera behavior, and atmospheric detail." },
        ],
      },
    ],
    config: {
      systemInstruction: getAnimationSystemPrompt(),
      temperature: 0.9,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const rawText = response.candidates?.[0]?.content?.parts?.[0];
  if (!rawText || !("text" in rawText) || !rawText.text) {
    throw new Error("No text in Gemini response");
  }

  const cleaned = rawText.text.replace(/```json\n?|```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned) as Suggestion[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Gemini returned invalid format");
  }

  return parsed.slice(0, 5).map((s) => ({
    title: typeof s.title === "string" ? s.title.slice(0, 50) : "Suggestion",
    prompt: typeof s.prompt === "string" ? s.prompt.slice(0, 1000) : "",
  })).filter((s) => s.prompt.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in to get prompt suggestions", requiresAuth: true },
        { status: 401 },
      );
    }

    const { imageUrl, generationId, regenerate } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    if (generationId && !regenerate) {
      const cached = await getCachedPrompts(generationId);
      if (cached) {
        return NextResponse.json({ suggestions: cached, source: "cache" });
      }
    }

    const suggestions = await generateWithGemini(imageUrl);

    if (generationId) {
      const persisted = await persistPrompts(generationId, user.id, suggestions);
      return NextResponse.json({ suggestions: persisted, source: "ai" });
    }

    return NextResponse.json({ suggestions, source: "ai" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[suggestions] Error:", message);
    return NextResponse.json({
      suggestions: getFallbackSuggestions(),
      source: "fallback",
      _debug: { error: message },
    });
  }
}

function getFallbackSuggestions(): Suggestion[] {
  return [
    {
      title: "Dynamic Action",
      prompt: "The character shifts weight explosively, driving forward with full-body momentum. Arms swing with follow-through, muscles engaging through the motion. The environment responds — dust kicks up from the ground, nearby objects wobble from the force. Impact energy radiates outward in subtle shockwave lines. Camera holds steady in a medium-wide shot, letting the full motion read clearly. The movement has real weight and snap to it.",
    },
    {
      title: "Quiet Moment",
      prompt: "The character settles into a gentle breathing rhythm, chest rising and falling softly. Eyes blink slowly, head tilts slightly to one side with a warm, content expression. A soft breeze moves through the scene, ruffling any loose elements. The lighting shifts subtly warmer, casting a gentle golden glow. Camera drifts in almost imperceptibly, creating an intimate close-up feel. Everything is peaceful and still.",
    },
    {
      title: "Cinematic Orbit",
      prompt: "Camera begins on a tight close-up of the character's face, capturing detail and expression. It pulls back smoothly while simultaneously orbiting to the right, revealing the full scene in a sweeping arc. Parallax depth separates foreground and background layers. Atmospheric particles drift lazily through the air. The subject stays perfectly still while the camera does all the work, creating a dramatic reveal of the complete composition.",
    },
    {
      title: "Cartoon Bounce",
      prompt: "The character squashes down with exaggerated compression, knees bending deeply. Then launches upward with stretchy cartoon physics — body elongating at the peak of the jump. Arms flail with playful exaggeration. At the apex, a brief hang-time pause before gravity pulls them back down. Landing with a satisfying squash, the ground dimples slightly beneath them. Small stars or sparkles pop around the character. Camera follows with a slight bobbing motion.",
    },
    {
      title: "Epic Buildup",
      prompt: "The scene starts still, tension building in the character's posture — subtle muscle tightening, eyes narrowing with focus. The atmosphere darkens slightly as energy gathers. Then the character erupts into their signature move with explosive force. Speed lines streak across the frame. The camera pushes in dramatically during the climactic moment. A burst of light or energy radiates from the point of action. The character holds the final pose with commanding presence.",
    },
  ];
}
