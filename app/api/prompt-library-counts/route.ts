import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// Cache for 60 s — counts don't need to be real-time
export const revalidate = 60;

export async function GET() {
  try {
    const admin = await createSupabaseAdmin();

    const { data, error } = await admin
      .from("prompt_library_uses")
      .select("prompt_text")
      .order("prompt_text");

    if (error) {
      console.error("[prompt-library-counts]", error.message);
      return NextResponse.json([], { status: 200 });
    }

    // Aggregate in-process (avoids needing a DB function)
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.prompt_text] = (counts[row.prompt_text] ?? 0) + 1;
    }

    const result = Object.entries(counts).map(([prompt_text, count]) => ({
      prompt_text,
      count,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[prompt-library-counts] unexpected error", err);
    return NextResponse.json([], { status: 200 });
  }
}
