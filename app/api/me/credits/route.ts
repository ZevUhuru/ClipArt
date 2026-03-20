import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ credits: 0 }, { status: 401 });
    }

    const admin = createSupabaseAdmin();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ credits: 0 });
    }

    return NextResponse.json({ credits: profile.credits });
  } catch {
    return NextResponse.json({ credits: 0 }, { status: 500 });
  }
}
