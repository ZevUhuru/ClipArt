import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { classifyPrompt } from "@/lib/classify";
import type { ContentType } from "@/lib/styles";

async function verifyAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin === true;
}

function titleLooksBad(title: string | null, prompt: string): boolean {
  if (!title) return true;

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm(title) === norm(prompt)) return true;
  if (norm(title) === norm(prompt.slice(0, 80))) return true;
  if (title.includes(",") && title.length > 50) return true;
  if (/^[A-Z][a-z]+-([A-Z][a-z]+-){2,}/.test(title)) return true;
  if (title.length > 70) return true;

  return false;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const dryRun = body.dryRun !== false;
  const limit = Math.min(body.limit || 50, 200);
  const contentType: string | undefined = body.contentType;

  const admin = createSupabaseAdmin();

  let query = admin
    .from("generations")
    .select("id, prompt, title, description, style, content_type, slug")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(500);

  if (contentType) {
    query = query.eq("content_type", contentType);
  }

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const badRows = (rows || []).filter((r) => titleLooksBad(r.title, r.prompt));
  const toProcess = badRows.slice(0, limit);

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      totalBad: badRows.length,
      previewing: toProcess.length,
      rows: toProcess.map((r) => ({
        id: r.id,
        currentTitle: r.title,
        prompt: r.prompt?.slice(0, 100),
        contentType: r.content_type,
      })),
    });
  }

  const results: Array<{ id: string; oldTitle: string | null; newTitle: string }> = [];

  for (const row of toProcess) {
    try {
      const ct = (row.content_type || "clipart") as ContentType;
      const classification = await classifyPrompt(row.prompt, row.style || "flat", ct);

      await admin
        .from("generations")
        .update({
          title: classification.title,
          description: classification.description,
        })
        .eq("id", row.id);

      results.push({
        id: row.id,
        oldTitle: row.title,
        newTitle: classification.title,
      });
    } catch (err) {
      console.error(`Reclassify failed for ${row.id}:`, err);
    }
  }

  return NextResponse.json({
    dryRun: false,
    totalBad: badRows.length,
    processed: results.length,
    results,
  });
}
