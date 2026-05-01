import { redirect } from "next/navigation";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";

export default async function PackStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/packs");

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/packs");

  return children;
}

