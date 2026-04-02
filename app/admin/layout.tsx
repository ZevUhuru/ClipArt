import { redirect } from "next/navigation";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <a href="/admin" className="text-lg font-bold text-gray-900">
              clip.art <span className="text-xs font-normal text-gray-400">admin</span>
            </a>
            <a href="/admin/images" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Images
            </a>
            <a href="/admin/categories" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Categories
            </a>
            <a href="/admin/models" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Models
            </a>
            <a href="/admin/animations" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Animations
            </a>
            <a href="/admin/users" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Users
            </a>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600">
            Back to site
          </a>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
