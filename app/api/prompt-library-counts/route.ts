import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const admin = await createSupabaseAdmin();

    // Count actual generations attributed to each prompt, not just clicks.
    // Join generations (where source="prompt_library") back to the original
    // prompt text via the FK so we get the canonical prompt string.
    const { data, error } = await admin
      .from("generations")
      .select("prompt_library_uses!inner(prompt_text)")
      .eq("source", "prompt_library")
      .not("prompt_library_use_id", "is", null);

    if (error) {
      console.error("[prompt-library-counts]", error.message);
      return NextResponse.json([], { status: 200 });
    }

    // Aggregate in-process
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const pt = (row.prompt_library_uses as { prompt_text: string } | null)?.prompt_text;
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
    console.error("[prompt-library-counts] unexpected error", err);
    return NextResponse.json([], { status: 200 });
  }
}
