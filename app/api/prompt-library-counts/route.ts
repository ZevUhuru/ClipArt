import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const admin = await createSupabaseAdmin();

    // Step 1: all generations that came from the prompt library
    const { data: gens, error: gensError } = await admin
      .from("generations")
      .select("prompt_library_use_id")
      .eq("source", "prompt_library")
      .not("prompt_library_use_id", "is", null);

    if (gensError) {
      console.error("[prompt-library-counts] generations query:", gensError.message);
      return NextResponse.json([], { status: 200 });
    }

    if (!gens || gens.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Step 2: look up prompt_text for each use id
    const useIds = [...new Set(gens.map((g) => g.prompt_library_use_id as number))];

    const { data: uses, error: usesError } = await admin
      .from("prompt_library_uses")
      .select("id, prompt_text")
      .in("id", useIds);

    if (usesError) {
      console.error("[prompt-library-counts] uses query:", usesError.message);
      return NextResponse.json([], { status: 200 });
    }

    // Map use_id → prompt_text
    const idToPrompt: Record<number, string> = {};
    for (const u of uses ?? []) idToPrompt[u.id] = u.prompt_text;

    // Count generations per prompt_text
    const counts: Record<string, number> = {};
    for (const gen of gens) {
      const pt = idToPrompt[gen.prompt_library_use_id as number];
      if (pt) counts[pt] = (counts[pt] ?? 0) + 1;
    }

    const result = Object.entries(counts).map(([prompt_text, count]) => ({
      prompt_text,
      count,
    }));

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[prompt-library-counts] unexpected error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
