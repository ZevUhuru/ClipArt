import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { TEXT_MODEL_IDS, type TextTask } from "@/lib/textAI";

const VALID_TASKS: TextTask[] = ["classification", "seo_generation", "animation_suggestions"];

const DEFAULTS: Record<TextTask, string> = {
  classification: "gemini-2.5-flash",
  seo_generation: "gemini-2.5-flash",
  animation_suggestions: "gemini-2.5-flash",
};

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

  return !!profile?.is_admin;
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "text_model_config")
    .single();

  if (error || !data) {
    return NextResponse.json(DEFAULTS);
  }

  const merged = { ...DEFAULTS, ...(data.value as Record<string, string>) };
  return NextResponse.json(merged);
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  for (const task of VALID_TASKS) {
    if (body[task] && !TEXT_MODEL_IDS.has(body[task])) {
      return NextResponse.json(
        { error: `Invalid model "${body[task]}" for task "${task}"` },
        { status: 400 },
      );
    }
  }

  const config: Record<string, string> = {};
  for (const task of VALID_TASKS) {
    config[task] = body[task] || DEFAULTS[task];
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("site_settings")
    .upsert({
      key: "text_model_config",
      value: config,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
