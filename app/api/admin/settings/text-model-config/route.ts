import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { TEXT_MODEL_IDS, type TextTask } from "@/lib/textAI";

const VALID_TASKS: TextTask[] = ["classification", "seo_generation", "animation_suggestions", "prompt_polish"];

const DEFAULTS: Record<TextTask, string> = {
  classification: "gemini-2.5-flash",
  seo_generation: "gemini-2.5-flash",
  animation_suggestions: "gemini-2.5-flash",
  prompt_polish: "gemini-2.5-flash",
};

// Migration map for deprecated / date-snapshotted model IDs. When a stored
// value isn't in the current catalog, we try this map before falling back to
// the task default. This lets us rename/alias models in textAI.ts without
// tripping the validator on admins' saved settings.
const MODEL_ID_MIGRATIONS: Record<string, string> = {
  "claude-sonnet-4-6-20250514": "claude-sonnet-4-6",
};

function normalizeModelId(value: unknown, task: TextTask): string {
  if (typeof value === "string") {
    if (TEXT_MODEL_IDS.has(value)) return value;
    const migrated = MODEL_ID_MIGRATIONS[value];
    if (migrated && TEXT_MODEL_IDS.has(migrated)) return migrated;
  }
  return DEFAULTS[task];
}

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

  // Normalize every stored value against the current catalog. This self-heals
  // stale entries (e.g. a previous snapshot-dated Anthropic model ID) by
  // mapping them to a supported ID or the task default before the admin UI
  // ever sees them. Next Save then persists the clean value.
  const stored = (data.value ?? {}) as Record<string, unknown>;
  const normalized: Record<TextTask, string> = { ...DEFAULTS };
  for (const task of VALID_TASKS) {
    normalized[task] = normalizeModelId(stored[task], task);
  }
  return NextResponse.json(normalized);
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Apply the same migration normalization used on read. Known deprecated IDs
  // (e.g. date-snapshotted aliases) map forward to a supported ID; genuinely
  // unknown IDs still reject with 400 so config typos surface loudly.
  const config: Record<string, string> = {};
  for (const task of VALID_TASKS) {
    const incoming = body[task];
    if (incoming == null || incoming === "") {
      config[task] = DEFAULTS[task];
      continue;
    }
    if (TEXT_MODEL_IDS.has(incoming)) {
      config[task] = incoming;
      continue;
    }
    const migrated = MODEL_ID_MIGRATIONS[incoming];
    if (migrated && TEXT_MODEL_IDS.has(migrated)) {
      config[task] = migrated;
      continue;
    }
    return NextResponse.json(
      { error: `Invalid model "${incoming}" for task "${task}"` },
      { status: 400 },
    );
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
