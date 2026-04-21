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

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "model_config")
    .single();

  if (error || !data) {
    return NextResponse.json({
      flat: "gemini",
      outline: "gemini",
      cartoon: "gemini",
      sticker: "gemini",
      vintage: "gemini",
      watercolor: "gemini",
    });
  }

  return NextResponse.json(data.value);
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const validModels = new Set(["gemini", "gpt-image-1", "gpt-image-2"]);
  for (const [, model] of Object.entries(body)) {
    if (!validModels.has(model as string)) {
      return NextResponse.json({ error: "Invalid model value" }, { status: 400 });
    }
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("site_settings")
    .upsert({
      key: "model_config",
      value: body,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
