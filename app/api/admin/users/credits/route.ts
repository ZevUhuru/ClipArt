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

  return profile?.is_admin === true;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, amount } = body;

  if (!userId || typeof amount !== "number" || amount === 0) {
    return NextResponse.json(
      { error: "userId and a non-zero amount are required" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();

  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newCredits = profile.credits + amount;

  if (newCredits < 0) {
    return NextResponse.json(
      { error: "Cannot reduce credits below zero" },
      { status: 400 }
    );
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ credits: newCredits })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ credits: newCredits });
}
