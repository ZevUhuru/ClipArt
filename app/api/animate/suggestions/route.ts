import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAnimationSystemPrompt } from "@/lib/promptKnowledge";

export const dynamic = "force-dynamic";

let _ai: InstanceType<typeof GoogleGenAI> | null = null;
function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _ai;
}

const MODEL = "gemini-2.0-flash";

interface Suggestion {
  title: string;
  prompt: string;
}

async function downloadImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download image");

  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return { base64, mimeType: contentType.split(";")[0] };
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

    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const { base64, mimeType } = await downloadImageAsBase64(imageUrl);

    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: "Generate 5 animation prompts for this clip art image." },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
      config: {
        systemInstruction: getAnimationSystemPrompt(),
        temperature: 0.8,
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (!part || !("text" in part) || !part.text) {
      return NextResponse.json({ suggestions: getFallbackSuggestions() });
    }

    const cleaned = part.text.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Suggestion[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({ suggestions: getFallbackSuggestions() });
    }

    const suggestions = parsed.slice(0, 5).map((s) => ({
      title: typeof s.title === "string" ? s.title.slice(0, 40) : "Suggestion",
      prompt: typeof s.prompt === "string" ? s.prompt.slice(0, 500) : "",
    })).filter((s) => s.prompt.length > 0);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Prompt suggestion failed:", err);
    return NextResponse.json({ suggestions: getFallbackSuggestions() });
  }
}

function getFallbackSuggestions(): Suggestion[] {
  return [
    { title: "Gentle Idle", prompt: "Gentle breathing idle animation with soft, peaceful swaying movement, maintaining the illustrated style" },
    { title: "Happy Wave", prompt: "Character waves hello with a cheerful smile, arm moving in a friendly greeting gesture" },
    { title: "Slow Zoom", prompt: "Camera slowly zooms in on the subject with soft focus, slight parallax depth effect" },
    { title: "Playful Bounce", prompt: "Bouncing and bobbing with playful cartoon energy, slight squash and stretch motion" },
    { title: "Dramatic Reveal", prompt: "Camera pulls back slowly to reveal the full scene, subtle atmospheric particles floating" },
  ];
}
