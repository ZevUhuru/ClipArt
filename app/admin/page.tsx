import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import AdminCredits from "./admin-credits";

export const revalidate = 0;

async function getAdminCredits(userId: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("profiles").select("credits").eq("id", userId).single();
  return data?.credits ?? 0;
}

async function getStats() {
  const admin = createSupabaseAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalGen, todayGen, totalPurchases, categoriesCount, usersCount] = await Promise.all([
    admin.from("generations").select("id", { count: "exact", head: true }),
    admin.from("generations").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    admin.from("purchases").select("amount_cents", { count: "exact" }),
    admin.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("profiles").select("id", { count: "exact", head: true }).not("email", "like", "%@esy.com"),
  ]);

  const totalRevenue = (totalPurchases.data || []).reduce(
    (sum: number, p: { amount_cents: number }) => sum + p.amount_cents, 0
  );

  return {
    totalGenerations: totalGen.count || 0,
    todayGenerations: todayGen.count || 0,
    totalRevenue: totalRevenue / 100,
    totalPurchases: totalPurchases.count || 0,
    totalCategories: categoriesCount.count || 0,
    totalUsers: usersCount.count || 0,
  };
}

export default async function AdminDashboard() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCredits = user ? await getAdminCredits(user.id) : 0;

  const stats = await getStats();

  const cards = [
    { label: "Total Generations", value: stats.totalGenerations.toLocaleString(), href: "/admin/images" },
    { label: "Today", value: stats.todayGenerations.toLocaleString(), href: "/admin/images" },
    { label: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, href: "#" },
    { label: "Purchases", value: stats.totalPurchases.toLocaleString(), href: "#" },
    { label: "Categories", value: stats.totalCategories.toLocaleString(), href: "/admin/categories" },
    { label: "Users", value: stats.totalUsers.toLocaleString(), href: "/admin/users" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          </Link>
        ))}
      </div>

      {user && (
        <div className="mt-8 max-w-sm">
          <AdminCredits userId={user.id} initialCredits={adminCredits} />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/images"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">Manage Images</h2>
          <p className="mt-1 text-sm text-gray-500">Edit titles, categories, visibility, and metadata for all generated clip art.</p>
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">Manage Categories</h2>
          <p className="mt-1 text-sm text-gray-500">Create and edit categories with SEO fields. Auto-generate SEO content with AI.</p>
        </Link>
        <Link
          href="/admin/models"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">Model Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">Choose which AI model (Gemini, GPT Image 1) powers each style. Changes take effect immediately.</p>
        </Link>
      </div>
    </div>
  );
}
