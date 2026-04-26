import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { VALID_BG_REMOVAL_MODEL_IDS, DEFAULT_BG_REMOVAL_MODEL_ID } from "@/lib/bgRemovalCatalog";

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

const DEFAULTS = { enabled: true, modelId: DEFAULT_BG_REMOVAL_MODEL_ID };

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "bg_removal_config")
    .single();

  const value = data?.value as { enabled?: boolean; modelId?: string } | null;
  return NextResponse.json({
    enabled: value?.enabled ?? DEFAULTS.enabled,
    modelId: value?.modelId ?? DEFAULTS.modelId,
  });
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
  }

  if (body.modelId !== undefined && !VALID_BG_REMOVAL_MODEL_IDS.has(body.modelId)) {
    return NextResponse.json({ error: "Invalid modelId" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Fetch existing config to merge (preserve fields not being updated)
  const { data: existing } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "bg_removal_config")
    .single();

  const current = (existing?.value ?? DEFAULTS) as { enabled: boolean; modelId: string };

  const { error } = await admin
    .from("site_settings")
    .upsert({
      key: "bg_removal_config",
      value: {
        enabled: body.enabled,
        modelId: body.modelId ?? current.modelId ?? DEFAULTS.modelId,
      },
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
