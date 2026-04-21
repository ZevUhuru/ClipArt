import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

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

const VALID_QUALITIES = new Set(["low", "medium", "high"]);

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "model_quality_config")
    .single();

  if (error || !data) {
    // Empty object is fine — generation defaults to "medium" per resolveQuality().
    return NextResponse.json({});
  }

  return NextResponse.json(data.value);
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  for (const [, quality] of Object.entries(body)) {
    if (!VALID_QUALITIES.has(quality as string)) {
      return NextResponse.json(
        { error: "Invalid quality value. Must be low | medium | high." },
        { status: 400 },
      );
    }
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("site_settings")
    .upsert({
      key: "model_quality_config",
      value: body,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
