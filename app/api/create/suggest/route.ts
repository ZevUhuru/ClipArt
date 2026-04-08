import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateText } from "@/lib/textAI";

export const dynamic = "force-dynamic";

const CONTENT_TYPE_CONTEXT: Record<string, string> = {
  clipart: `You are an expert clip art prompt engineer. The user wants to generate a clip art image — a clean, isolated graphic on a transparent or solid background with no scene. Focus on the subject's appearance, pose, expression, colors, and style. Keep prompts concise (1-3 sentences). Do NOT describe backgrounds or environments.`,
  illustration: `You are an expert illustration prompt engineer. The user wants to generate a full illustration with background, environment, lighting, and atmosphere. Focus on scene composition, mood, color palette, depth, and narrative. Prompts should be vivid and descriptive (2-4 sentences).`,
  coloring: `You are an expert coloring page prompt engineer. The user wants to generate a printable coloring page with bold black outlines on white background. Focus on clear shapes, line thickness, age-appropriate complexity, and composition. Keep prompts clear and specific about what should appear. Do NOT mention colors — these are black-and-white line drawings.`,
};

const SYSTEM_PROMPT = `You take a rough prompt draft from a user and produce exactly 4 polished, creative variations. Each variation should take a different creative angle while staying true to the user's intent.

Return ONLY a JSON array of objects with "title" (3-5 word creative label) and "prompt" (the polished prompt text). No markdown, no explanation — just the JSON array.

Example format:
[{"title":"Playful Garden Scene","prompt":"..."},{"title":"Whimsical Sunset","prompt":"..."}]`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in to use AI suggestions", requiresAuth: true },
        { status: 401 },
      );
    }

    const { contentType, draft, style } = await req.json();

    if (!draft || typeof draft !== "string" || !draft.trim()) {
      return NextResponse.json(
        { error: "draft is required" },
        { status: 400 },
      );
    }

    const ct = typeof contentType === "string" ? contentType : "clipart";
    const context = CONTENT_TYPE_CONTEXT[ct] || CONTENT_TYPE_CONTEXT.clipart;
    const styleNote = style ? ` The selected visual style is "${style}".` : "";

    const fullSystem = `${context}${styleNote}\n\n${SYSTEM_PROMPT}`;
    const userMessage = `Polish this rough draft into 4 creative prompt variations:\n\n"${draft.trim()}"`;

    const rawText = await generateText(
      "prompt_polish",
      fullSystem,
      userMessage,
      { temperature: 0.9 },
    );

    const cleaned = rawText.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Model returned invalid format");
    }

    const suggestions = parsed
      .slice(0, 4)
      .map((s: { title?: string; prompt?: string }) => ({
        title: typeof s.title === "string" ? s.title.slice(0, 60) : "Suggestion",
        prompt: typeof s.prompt === "string" ? s.prompt.slice(0, 500) : "",
      }))
      .filter((s: { prompt: string }) => s.prompt.length > 0);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[create/suggest] Error:", err);
    Sentry.captureException(err, {
      tags: { type: "prompt_polish_error" },
    });

    return NextResponse.json({
      suggestions: getFallbackSuggestions(),
      source: "fallback",
    });
  }
}

function getFallbackSuggestions() {
  return [
    {
      title: "Classic & Clean",
      prompt: "A cheerful, brightly colored design with clean lines and a friendly, approachable feel",
    },
    {
      title: "Whimsical & Fun",
      prompt: "A playful, cartoon-style design with exaggerated proportions and vibrant colors",
    },
    {
      title: "Detailed & Rich",
      prompt: "A richly detailed design with intricate textures, warm lighting, and depth",
    },
    {
      title: "Minimal & Modern",
      prompt: "A sleek, minimalist design with flat colors, geometric shapes, and elegant simplicity",
    },
  ];
}
